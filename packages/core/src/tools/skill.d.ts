/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { ToolResult, ToolResultDisplay } from './tools.js';
import type { Config } from '../config/config.js';
import type { SkillManager } from '../skills/skill-manager.js';
export interface SkillParams {
    skill: string;
}
/**
 * Skill tool that enables the model to access skill definitions.
 * The tool dynamically loads available skills and includes them in its description
 * for the model to choose from.
 */
export declare class SkillTool extends BaseDeclarativeTool<SkillParams, ToolResult> {
    private readonly config;
    static readonly Name: string;
    private skillManager;
    private availableSkills;
    constructor(config: Config);
    /**
     * Asynchronously initializes the tool by loading available skills
     * and updating the description and schema.
     */
    refreshSkills(): Promise<void>;
    /**
     * Updates the tool's description and schema based on available skills.
     */
    private updateDescriptionAndSchema;
    validateToolParams(params: SkillParams): string | null;
    protected createInvocation(params: SkillParams): SkillToolInvocation;
    getAvailableSkillNames(): string[];
}
declare class SkillToolInvocation extends BaseToolInvocation<SkillParams, ToolResult> {
    private readonly config;
    private readonly skillManager;
    constructor(config: Config, skillManager: SkillManager, params: SkillParams);
    getDescription(): string;
    shouldConfirmExecute(): Promise<false>;
    execute(_signal?: AbortSignal, _updateOutput?: (output: ToolResultDisplay) => void): Promise<ToolResult>;
}
export {};
