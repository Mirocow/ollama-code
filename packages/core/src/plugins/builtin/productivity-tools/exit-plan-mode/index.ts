/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Exit Plan Mode Tool
 *
 * Saves plans to model_storage via the 'plans' namespace.
 * Plans are linked to todos for progress tracking.
 * Data is stored in: ~/.ollama-code/projects/<hash>/storage/<session-id>.json
 * Under the 'plans' namespace with key 'current'.
 */

import type {
  ToolPlanConfirmationDetails,
  ToolResult,
} from '../../../../tools/tools.js';
import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
  ToolConfirmationOutcome,
} from '../../../../tools/tools.js';
import type { FunctionDeclaration } from '../../../../types/content.js';
import type { Config } from '../../../../config/config.js';
import { ApprovalMode } from '../../../../config/config.js';
import { createDebugLogger } from '../../../../utils/debugLogger.js';
import {
  storageGet,
  storageSet,
  StorageNamespaces,
} from '../../storage-tools/index.js';
import { linkTodosToPlan } from '../todo-write/index.js';

const debugLogger = createDebugLogger('EXIT_PLAN_MODE');

// Namespace for plans in storage
const PLANS_NAMESPACE = StorageNamespaces.PLANS;
const PLANS_KEY = 'current';

// Default TTL for plans: 7 days
const PLAN_DEFAULT_TTL = 7 * 24 * 60 * 60;

export interface PlanData {
  id: string;
  plan: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  todos?: Array<{ id: string; content: string; status: string }>;
  progress?: number;
  sessionId: string;
}

export interface ExitPlanModeParams {
  plan: string;
}

/**
 * Generate a unique plan ID
 */
function generatePlanId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `plan_${timestamp}_${random}`;
}

/**
 * Get the current active plan from storage
 */
export async function getActivePlan(): Promise<PlanData | null> {
  try {
    const data = await storageGet<PlanData>(PLANS_NAMESPACE, PLANS_KEY, {
      scope: 'project',
    });
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Clear the current plan
 */
export async function clearActivePlan(): Promise<void> {
  try {
    const plan = await getActivePlan();
    if (plan) {
      plan.status = 'abandoned';
      plan.updatedAt = new Date().toISOString();
      await storageSet(PLANS_NAMESPACE, PLANS_KEY, plan, { scope: 'project' });
    }
  } catch {
    // Ignore errors
  }
}

const exitPlanModeToolDescription = `Use this tool when you are in plan mode and have finished presenting your plan and are ready to code. This will prompt the user to exit plan mode.
IMPORTANT: Only use this tool when the task requires planning the implementation steps of a task that requires writing code. For research tasks where you're gathering information, searching files, reading files or in general trying to understand the codebase - do NOT use this tool.

Eg.
1. Initial task: "Search for and understand the implementation of vim mode in the codebase" - Do not use the exit plan mode tool because you are not planning the implementation steps of a task.
2. Initial task: "Help me implement yank mode for vim" - Use the exit plan mode tool after you have finished planning the implementation steps of the task.
`;

const exitPlanModeToolSchemaData: FunctionDeclaration = {
  name: 'exit_plan_mode',
  description: exitPlanModeToolDescription,
  parametersJsonSchema: {
    type: 'object',
    properties: {
      plan: {
        type: 'string',
        description:
          'The plan you came up with, that you want to run by the user for approval. Supports markdown. The plan should be pretty concise.',
      },
    },
    required: ['plan'],
    additionalProperties: false,
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
};

class ExitPlanModeToolInvocation extends BaseToolInvocation<
  ExitPlanModeParams,
  ToolResult
> {
  private wasApproved = false;
  private planId: string;

  constructor(
    private readonly config: Config,
    params: ExitPlanModeParams,
  ) {
    super(params);
    this.planId = generatePlanId();
  }

  getDescription(): string {
    return 'Plan:';
  }

  override async shouldConfirmExecute(
    _abortSignal: AbortSignal,
  ): Promise<ToolPlanConfirmationDetails> {
    const details: ToolPlanConfirmationDetails = {
      type: 'plan',
      title: 'Would you like to proceed?',
      plan: this.params.plan,
      onConfirm: async (outcome: ToolConfirmationOutcome) => {
        switch (outcome) {
          case ToolConfirmationOutcome.ProceedAlways:
            this.wasApproved = true;
            this.setApprovalModeSafely(ApprovalMode.AUTO_EDIT);
            break;
          case ToolConfirmationOutcome.ProceedOnce:
            this.wasApproved = true;
            this.setApprovalModeSafely(ApprovalMode.DEFAULT);
            break;
          case ToolConfirmationOutcome.Cancel:
            this.wasApproved = false;
            this.setApprovalModeSafely(ApprovalMode.PLAN);
            break;
          default:
            // Treat any other outcome as manual approval to preserve conservative behaviour.
            this.wasApproved = true;
            this.setApprovalModeSafely(ApprovalMode.DEFAULT);
            break;
        }
      },
    };

    return details;
  }

  private setApprovalModeSafely(mode: ApprovalMode): void {
    try {
      this.config.setApprovalMode(mode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugLogger.error(
        `[ExitPlanModeTool] Failed to set approval mode to "${mode}": ${errorMessage}`,
      );
    }
  }

  async execute(_signal: AbortSignal): Promise<ToolResult> {
    const { plan } = this.params;
    const sessionId = this.config.getSessionId() || 'default';

    try {
      if (!this.wasApproved) {
        const rejectionMessage =
          'Plan execution was not approved. Remaining in plan mode.';
        return {
          llmContent: rejectionMessage,
          returnDisplay: rejectionMessage,
        };
      }

      // Save the plan to model_storage
      const now = new Date().toISOString();
      const planData: PlanData = {
        id: this.planId,
        plan,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        todos: [],
        progress: 0,
        sessionId,
      };

      await storageSet(PLANS_NAMESPACE, PLANS_KEY, planData, {
        scope: 'project',
        ttl: PLAN_DEFAULT_TTL,
      });

      // Link existing todos to this plan
      await linkTodosToPlan(this.planId);

      debugLogger.info(`[ExitPlanMode] Plan saved with ID: ${this.planId}`);

      const llmMessage = `User has approved your plan. You can now start coding. Start with updating your todo list if applicable.

<system-reminder>
Plan saved: "${plan}"
Plan ID: ${this.planId}
TTL: 7 days
</system-reminder>`;
      const displayMessage = 'User approved the plan.';

      return {
        llmContent: llmMessage,
        returnDisplay: {
          type: 'plan_summary',
          message: displayMessage,
          plan,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      debugLogger.error(
        `[ExitPlanModeTool] Error executing exit_plan_mode: ${errorMessage}`,
      );

      const errorLlmContent = `Failed to present plan: ${errorMessage}`;

      return {
        llmContent: errorLlmContent,
        returnDisplay: `Error presenting plan: ${errorMessage}`,
      };
    }
  }
}

export class ExitPlanModeTool extends BaseDeclarativeTool<
  ExitPlanModeParams,
  ToolResult
> {
  static readonly Name: string = 'exit_plan_mode';

  constructor(private readonly config: Config) {
    super(
      ExitPlanModeTool.Name,
      'ExitPlanMode',
      exitPlanModeToolDescription,
      Kind.Think,
      exitPlanModeToolSchemaData.parametersJsonSchema as Record<
        string,
        unknown
      >,
    );
  }

  override validateToolParams(params: ExitPlanModeParams): string | null {
    // Validate plan parameter
    if (
      !params.plan ||
      typeof params.plan !== 'string' ||
      params.plan.trim() === ''
    ) {
      return 'Parameter "plan" must be a non-empty string.';
    }

    return null;
  }

  protected createInvocation(params: ExitPlanModeParams) {
    return new ExitPlanModeToolInvocation(this.config, params);
  }
}
