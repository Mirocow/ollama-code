/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig, BugCommandSettings, TelemetrySettings, AuthType, ChatCompressionSettings, ModelProvidersConfig } from '@ollama-code/ollama-code-core';
import { ApprovalMode } from '@ollama-code/ollama-code-core';
import type { CustomTheme } from '../ui/themes/theme.js';
export type SettingsType = 'boolean' | 'string' | 'number' | 'array' | 'object' | 'enum';
export type SettingsValue = boolean | string | number | string[] | object | undefined;
/**
 * Setting datatypes that "toggle" through a fixed list of options
 * (e.g. an enum or true/false) rather than allowing for free form input
 * (like a number or string).
 */
export declare const TOGGLE_TYPES: ReadonlySet<SettingsType | undefined>;
export interface SettingEnumOption {
    value: string | number;
    label: string;
}
export declare enum MergeStrategy {
    REPLACE = "replace",
    CONCAT = "concat",
    UNION = "union",
    SHALLOW_MERGE = "shallow_merge"
}
export interface SettingDefinition {
    type: SettingsType;
    label: string;
    category: string;
    requiresRestart: boolean;
    default: SettingsValue;
    description?: string;
    parentKey?: string;
    key?: string;
    properties?: SettingsSchema;
    showInDialog?: boolean;
    mergeStrategy?: MergeStrategy;
    /** Enum type options  */
    options?: readonly SettingEnumOption[];
}
export interface SettingsSchema {
    [key: string]: SettingDefinition;
}
export type MemoryImportFormat = 'tree' | 'flat';
export type DnsResolutionOrder = 'ipv4first' | 'verbatim';
/**
 * The canonical schema for all settings.
 * The structure of this object defines the structure of the `Settings` type.
 * `as const` is crucial for TypeScript to infer the most specific types possible.
 */
declare const SETTINGS_SCHEMA: {
    readonly mcpServers: {
        readonly type: "object";
        readonly label: "MCP Servers";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: Record<string, MCPServerConfig>;
        readonly description: "Configuration for MCP servers.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
    };
    readonly modelProviders: {
        readonly type: "object";
        readonly label: "Model Providers";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: ModelProvidersConfig;
        readonly description: "Model providers configuration grouped by authType. Each authType contains an array of model configurations.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.REPLACE;
    };
    readonly codingPlan: {
        readonly type: "object";
        readonly label: "Coding Plan";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Coding Plan template version tracking and configuration.";
        readonly showInDialog: false;
        readonly properties: {
            readonly version: {
                readonly type: "string";
                readonly label: "Coding Plan Template Version";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "SHA256 hash of the Coding Plan template. Used to detect template updates.";
                readonly showInDialog: false;
            };
        };
    };
    readonly env: {
        readonly type: "object";
        readonly label: "Environment Variables";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: Record<string, string>;
        readonly description: "Environment variables to set as fallback defaults. These are loaded with the lowest priority: system environment variables > .env files > settings.env.";
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
    };
    readonly general: {
        readonly type: "object";
        readonly label: "General";
        readonly category: "General";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "General application settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly preferredEditor: {
                readonly type: "string";
                readonly label: "Preferred Editor";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "The preferred editor to open files in.";
                readonly showInDialog: true;
            };
            readonly vimMode: {
                readonly type: "boolean";
                readonly label: "Vim Mode";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable Vim keybindings";
                readonly showInDialog: true;
            };
            readonly enableAutoUpdate: {
                readonly type: "boolean";
                readonly label: "Enable Auto Update";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Enable automatic update checks and installations on startup.";
                readonly showInDialog: true;
            };
            readonly gitCoAuthor: {
                readonly type: "boolean";
                readonly label: "Attribution: commit";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Automatically add a Co-authored-by trailer to git commit messages when commits are made through Ollama Code.";
                readonly showInDialog: true;
            };
            readonly checkpointing: {
                readonly type: "object";
                readonly label: "Checkpointing";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Session checkpointing settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Enable Checkpointing";
                        readonly category: "General";
                        readonly requiresRestart: true;
                        readonly default: false;
                        readonly description: "Enable session checkpointing for recovery";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly debugKeystrokeLogging: {
                readonly type: "boolean";
                readonly label: "Debug Keystroke Logging";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable debug logging of keystrokes to the console.";
                readonly showInDialog: false;
            };
            readonly language: {
                readonly type: "enum";
                readonly label: "Language: UI";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: "auto";
                readonly description: string;
                readonly showInDialog: true;
                readonly options: readonly SettingEnumOption[];
            };
            readonly outputLanguage: {
                readonly type: "string";
                readonly label: "Language: Model";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: "auto";
                readonly description: string;
                readonly showInDialog: true;
            };
            readonly terminalBell: {
                readonly type: "boolean";
                readonly label: "Terminal Bell Notification";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Play terminal bell sound when response completes or needs approval.";
                readonly showInDialog: true;
            };
            readonly chatRecording: {
                readonly type: "boolean";
                readonly label: "Chat Recording";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Enable saving chat history to disk. Disabling this will also prevent --continue and --resume from working.";
                readonly showInDialog: false;
            };
            readonly defaultFileEncoding: {
                readonly type: "enum";
                readonly label: "Default File Encoding";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: "utf-8";
                readonly description: "Default encoding for new files. Use \"utf-8\" (default) for UTF-8 without BOM, or \"utf-8-bom\" for UTF-8 with BOM. Only change this if your project specifically requires BOM.";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "utf-8";
                    readonly label: "UTF-8 (without BOM)";
                }, {
                    readonly value: "utf-8-bom";
                    readonly label: "UTF-8 with BOM";
                }];
            };
        };
    };
    readonly output: {
        readonly type: "object";
        readonly label: "Output";
        readonly category: "General";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings for the CLI output.";
        readonly showInDialog: false;
        readonly properties: {
            readonly format: {
                readonly type: "enum";
                readonly label: "Output Format";
                readonly category: "General";
                readonly requiresRestart: false;
                readonly default: "text";
                readonly description: "The format of the CLI output.";
                readonly showInDialog: false;
                readonly options: readonly [{
                    readonly value: "text";
                    readonly label: "Text";
                }, {
                    readonly value: "json";
                    readonly label: "JSON";
                }];
            };
        };
    };
    readonly ui: {
        readonly type: "object";
        readonly label: "UI";
        readonly category: "UI";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "User interface settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly theme: {
                readonly type: "string";
                readonly label: "Theme";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: string;
                readonly description: "The color theme for the UI.";
                readonly showInDialog: true;
            };
            readonly customThemes: {
                readonly type: "object";
                readonly label: "Custom Themes";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: Record<string, CustomTheme>;
                readonly description: "Custom theme definitions.";
                readonly showInDialog: false;
            };
            readonly hideWindowTitle: {
                readonly type: "boolean";
                readonly label: "Hide Window Title";
                readonly category: "UI";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Hide the window title bar";
                readonly showInDialog: false;
            };
            readonly showStatusInTitle: {
                readonly type: "boolean";
                readonly label: "Show Status in Title";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Show Ollama Code status and thoughts in the terminal window title";
                readonly showInDialog: false;
            };
            readonly hideTips: {
                readonly type: "boolean";
                readonly label: "Hide Tips";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Hide helpful tips in the UI";
                readonly showInDialog: true;
            };
            readonly showLineNumbers: {
                readonly type: "boolean";
                readonly label: "Show Line Numbers in Code";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show line numbers in the code output.";
                readonly showInDialog: true;
            };
            readonly showCitations: {
                readonly type: "boolean";
                readonly label: "Show Citations";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Show citations for generated text in the chat.";
                readonly showInDialog: false;
            };
            readonly customWittyPhrases: {
                readonly type: "array";
                readonly label: "Custom Witty Phrases";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Custom witty phrases to display during loading.";
                readonly showInDialog: false;
            };
            readonly enableWelcomeBack: {
                readonly type: "boolean";
                readonly label: "Show Welcome Back Dialog";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show welcome back dialog when returning to a project with conversation history.";
                readonly showInDialog: true;
            };
            readonly enableUserFeedback: {
                readonly type: "boolean";
                readonly label: "Enable User Feedback";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Show optional feedback dialog after conversations to help improve Qwen performance.";
                readonly showInDialog: true;
            };
            readonly accessibility: {
                readonly type: "object";
                readonly label: "Accessibility";
                readonly category: "UI";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Accessibility settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enableLoadingPhrases: {
                        readonly type: "boolean";
                        readonly label: "Enable Loading Phrases";
                        readonly category: "UI";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Enable loading phrases (disable for accessibility)";
                        readonly showInDialog: true;
                    };
                    readonly screenReader: {
                        readonly type: "boolean";
                        readonly label: "Screen Reader Mode";
                        readonly category: "UI";
                        readonly requiresRestart: true;
                        readonly default: boolean | undefined;
                        readonly description: "Render output in plain-text to be more screen reader accessible";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly feedbackLastShownTimestamp: {
                readonly type: "number";
                readonly label: "Feedback Last Shown Timestamp";
                readonly category: "UI";
                readonly requiresRestart: false;
                readonly default: 0;
                readonly description: "The last time the feedback dialog was shown.";
                readonly showInDialog: false;
            };
        };
    };
    readonly ide: {
        readonly type: "object";
        readonly label: "IDE";
        readonly category: "IDE";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "IDE integration settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly enabled: {
                readonly type: "boolean";
                readonly label: "Auto-connect to IDE";
                readonly category: "IDE";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Enable IDE integration mode";
                readonly showInDialog: true;
            };
            readonly hasSeenNudge: {
                readonly type: "boolean";
                readonly label: "Has Seen IDE Integration Nudge";
                readonly category: "IDE";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Whether the user has seen the IDE integration nudge.";
                readonly showInDialog: false;
            };
        };
    };
    readonly privacy: {
        readonly type: "object";
        readonly label: "Privacy";
        readonly category: "Privacy";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Privacy-related settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly usageStatisticsEnabled: {
                readonly type: "boolean";
                readonly label: "Enable Usage Statistics";
                readonly category: "Privacy";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Enable collection of usage statistics";
                readonly showInDialog: true;
            };
        };
    };
    readonly telemetry: {
        readonly type: "object";
        readonly label: "Telemetry";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: TelemetrySettings | undefined;
        readonly description: "Telemetry configuration.";
        readonly showInDialog: false;
    };
    readonly model: {
        readonly type: "object";
        readonly label: "Model";
        readonly category: "Model";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings related to the generative model.";
        readonly showInDialog: false;
        readonly properties: {
            readonly name: {
                readonly type: "string";
                readonly label: "Model";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "The model to use for conversations.";
                readonly showInDialog: false;
            };
            readonly maxSessionTurns: {
                readonly type: "number";
                readonly label: "Max Session Turns";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: -1;
                readonly description: "Maximum number of user/model/tool turns to keep in a session. -1 means unlimited.";
                readonly showInDialog: false;
            };
            readonly summarizeToolOutput: {
                readonly type: "object";
                readonly label: "Summarize Tool Output";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: Record<string, {
                    tokenBudget?: number;
                }> | undefined;
                readonly description: "Settings for summarizing tool output.";
                readonly showInDialog: false;
            };
            readonly chatCompression: {
                readonly type: "object";
                readonly label: "Chat Compression";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: ChatCompressionSettings | undefined;
                readonly description: "Chat compression settings.";
                readonly showInDialog: false;
            };
            readonly sessionTokenLimit: {
                readonly type: "number";
                readonly label: "Session Token Limit";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: number | undefined;
                readonly description: "The maximum number of tokens allowed in a session.";
                readonly showInDialog: false;
            };
            readonly skipNextSpeakerCheck: {
                readonly type: "boolean";
                readonly label: "Skip Next Speaker Check";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Skip the next speaker check.";
                readonly showInDialog: false;
            };
            readonly skipLoopDetection: {
                readonly type: "boolean";
                readonly label: "Skip Loop Detection";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Disable all loop detection checks (streaming and LLM).";
                readonly showInDialog: false;
            };
            readonly skipStartupContext: {
                readonly type: "boolean";
                readonly label: "Skip Startup Context";
                readonly category: "Model";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Avoid sending the workspace startup context at the beginning of each session.";
                readonly showInDialog: false;
            };
            readonly enableOpenAILogging: {
                readonly type: "boolean";
                readonly label: "Enable OpenAI Logging";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Enable OpenAI logging.";
                readonly showInDialog: false;
            };
            readonly openAILoggingDir: {
                readonly type: "string";
                readonly label: "OpenAI Logging Directory";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "Custom directory path for OpenAI API logs. If not specified, defaults to logs/openai in the current working directory.";
                readonly showInDialog: false;
            };
            readonly generationConfig: {
                readonly type: "object";
                readonly label: "Generation Configuration";
                readonly category: "Model";
                readonly requiresRestart: false;
                readonly default: Record<string, unknown> | undefined;
                readonly description: "Generation configuration settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly timeout: {
                        readonly type: "number";
                        readonly label: "Timeout";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Request timeout in milliseconds.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly maxRetries: {
                        readonly type: "number";
                        readonly label: "Max Retries";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: number | undefined;
                        readonly description: "Maximum number of retries for failed requests.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly enableCacheControl: {
                        readonly type: "boolean";
                        readonly label: "Enable Cache Control";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: true;
                        readonly description: "Enable cache control for DashScope providers.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                    readonly schemaCompliance: {
                        readonly type: "enum";
                        readonly label: "Tool Schema Compliance";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: "auto";
                        readonly description: "The compliance mode for tool schemas sent to the model. Use \"openapi_30\" for strict OpenAPI 3.0 compatibility (e.g., for Gemini).";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                        readonly options: readonly [{
                            readonly value: "auto";
                            readonly label: "Auto (Default)";
                        }, {
                            readonly value: "openapi_30";
                            readonly label: "OpenAPI 3.0 Strict";
                        }];
                    };
                    readonly contextWindowSize: {
                        readonly type: "number";
                        readonly label: "Context Window Size";
                        readonly category: "Generation Configuration";
                        readonly requiresRestart: false;
                        readonly default: undefined;
                        readonly description: "Overrides the default context window size for the selected model. Use this setting when a provider's effective context limit differs from Ollama Code's default. This value defines the model's assumed maximum context capacity, not a per-request token limit.";
                        readonly parentKey: "generationConfig";
                        readonly showInDialog: false;
                    };
                };
            };
        };
    };
    readonly context: {
        readonly type: "object";
        readonly label: "Context";
        readonly category: "Context";
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: "Settings for managing context provided to the model.";
        readonly showInDialog: false;
        readonly properties: {
            readonly fileName: {
                readonly type: "object";
                readonly label: "Context File Name";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: string | string[] | undefined;
                readonly description: "The name of the context file.";
                readonly showInDialog: false;
            };
            readonly importFormat: {
                readonly type: "string";
                readonly label: "Memory Import Format";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: MemoryImportFormat | undefined;
                readonly description: "The format to use when importing memory.";
                readonly showInDialog: false;
            };
            readonly includeDirectories: {
                readonly type: "array";
                readonly label: "Include Directories";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Additional directories to include in the workspace context. Missing directories will be skipped with a warning.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.CONCAT;
            };
            readonly loadFromIncludeDirectories: {
                readonly type: "boolean";
                readonly label: "Load Memory From Include Directories";
                readonly category: "Context";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Whether to load memory files from include directories.";
                readonly showInDialog: false;
            };
            readonly fileFiltering: {
                readonly type: "object";
                readonly label: "File Filtering";
                readonly category: "Context";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Settings for git-aware file filtering.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly respectGitIgnore: {
                        readonly type: "boolean";
                        readonly label: "Respect .gitignore";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Respect .gitignore files when searching";
                        readonly showInDialog: true;
                    };
                    readonly respectOllamaCodeIgnore: {
                        readonly type: "boolean";
                        readonly label: "Respect .ollamaignore";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Respect .ollamaignore files when searching";
                        readonly showInDialog: true;
                    };
                    readonly enableRecursiveFileSearch: {
                        readonly type: "boolean";
                        readonly label: "Enable Recursive File Search";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Enable recursive file search functionality";
                        readonly showInDialog: false;
                    };
                    readonly enableFuzzySearch: {
                        readonly type: "boolean";
                        readonly label: "Enable Fuzzy Search";
                        readonly category: "Context";
                        readonly requiresRestart: true;
                        readonly default: true;
                        readonly description: "Enable fuzzy search when searching for files.";
                        readonly showInDialog: true;
                    };
                };
            };
        };
    };
    readonly tools: {
        readonly type: "object";
        readonly label: "Tools";
        readonly category: "Tools";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Settings for built-in and custom tools.";
        readonly showInDialog: false;
        readonly properties: {
            readonly sandbox: {
                readonly type: "object";
                readonly label: "Sandbox";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: boolean | string | undefined;
                readonly description: "Sandbox execution environment (can be a boolean or a path string).";
                readonly showInDialog: false;
            };
            readonly shell: {
                readonly type: "object";
                readonly label: "Shell";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for shell execution.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enableInteractiveShell: {
                        readonly type: "boolean";
                        readonly label: "Interactive Shell (PTY)";
                        readonly category: "Tools";
                        readonly requiresRestart: true;
                        readonly default: false;
                        readonly description: "Use node-pty for an interactive shell experience. Fallback to child_process still applies.";
                        readonly showInDialog: true;
                    };
                    readonly pager: {
                        readonly type: "string";
                        readonly label: "Pager";
                        readonly category: "Tools";
                        readonly requiresRestart: false;
                        readonly default: string | undefined;
                        readonly description: "The pager command to use for shell output. Defaults to `cat`.";
                        readonly showInDialog: false;
                    };
                    readonly showColor: {
                        readonly type: "boolean";
                        readonly label: "Show Color";
                        readonly category: "Tools";
                        readonly requiresRestart: false;
                        readonly default: false;
                        readonly description: "Show color in shell output.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly core: {
                readonly type: "array";
                readonly label: "Core Tools";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Paths to core tool definitions.";
                readonly showInDialog: false;
            };
            readonly allowed: {
                readonly type: "array";
                readonly label: "Allowed Tools";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "A list of tool names that will bypass the confirmation dialog.";
                readonly showInDialog: false;
            };
            readonly exclude: {
                readonly type: "array";
                readonly label: "Exclude Tools";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "Tool names to exclude from discovery.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly approvalMode: {
                readonly type: "enum";
                readonly label: "Tool Approval Mode";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: ApprovalMode.DEFAULT;
                readonly description: "Approval mode for tool usage. Controls how tools are approved before execution.";
                readonly showInDialog: true;
                readonly options: readonly [{
                    readonly value: ApprovalMode.PLAN;
                    readonly label: "Plan";
                }, {
                    readonly value: ApprovalMode.DEFAULT;
                    readonly label: "Default";
                }, {
                    readonly value: ApprovalMode.AUTO_EDIT;
                    readonly label: "Auto Edit";
                }, {
                    readonly value: ApprovalMode.YOLO;
                    readonly label: "YOLO";
                }];
            };
            readonly autoAccept: {
                readonly type: "boolean";
                readonly label: "Auto Accept";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: false;
                readonly description: "Automatically accept and execute tool calls that are considered safe (e.g., read-only operations) without explicit user confirmation.";
                readonly showInDialog: false;
            };
            readonly discoveryCommand: {
                readonly type: "string";
                readonly label: "Tool Discovery Command";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: "Command to run for tool discovery.";
                readonly showInDialog: false;
            };
            readonly callCommand: {
                readonly type: "string";
                readonly label: "Tool Call Command";
                readonly category: "Tools";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: "Command to run for tool calls.";
                readonly showInDialog: false;
            };
            readonly useRipgrep: {
                readonly type: "boolean";
                readonly label: "Use Ripgrep";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Use ripgrep for file content search instead of the fallback implementation. Provides faster search performance.";
                readonly showInDialog: false;
            };
            readonly useBuiltinRipgrep: {
                readonly type: "boolean";
                readonly label: "Use Builtin Ripgrep";
                readonly category: "Tools";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Use the bundled ripgrep binary. When set to false, the system-level \"rg\" command will be used instead. This setting is only effective when useRipgrep is true.";
                readonly showInDialog: false;
            };
            readonly enableToolOutputTruncation: {
                readonly type: "boolean";
                readonly label: "Enable Tool Output Truncation";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: true;
                readonly description: "Enable truncation of large tool outputs.";
                readonly showInDialog: false;
            };
            readonly truncateToolOutputThreshold: {
                readonly type: "number";
                readonly label: "Tool Output Truncation Threshold";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: 25000;
                readonly description: "Truncate tool output if it is larger than this many characters. Set to -1 to disable.";
                readonly showInDialog: false;
            };
            readonly truncateToolOutputLines: {
                readonly type: "number";
                readonly label: "Tool Output Truncation Lines";
                readonly category: "General";
                readonly requiresRestart: true;
                readonly default: 1000;
                readonly description: "The number of lines to keep when truncating tool output.";
                readonly showInDialog: false;
            };
        };
    };
    readonly mcp: {
        readonly type: "object";
        readonly label: "MCP";
        readonly category: "MCP";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Settings for Model Context Protocol (MCP) servers.";
        readonly showInDialog: false;
        readonly properties: {
            readonly serverCommand: {
                readonly type: "string";
                readonly label: "MCP Server Command";
                readonly category: "MCP";
                readonly requiresRestart: true;
                readonly default: string | undefined;
                readonly description: "Command to start an MCP server.";
                readonly showInDialog: false;
            };
            readonly allowed: {
                readonly type: "array";
                readonly label: "Allow MCP Servers";
                readonly category: "MCP";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "A list of MCP servers to allow.";
                readonly showInDialog: false;
            };
            readonly excluded: {
                readonly type: "array";
                readonly label: "Exclude MCP Servers";
                readonly category: "MCP";
                readonly requiresRestart: true;
                readonly default: string[] | undefined;
                readonly description: "A list of MCP servers to exclude.";
                readonly showInDialog: false;
            };
        };
    };
    readonly security: {
        readonly type: "object";
        readonly label: "Security";
        readonly category: "Security";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Security-related settings.";
        readonly showInDialog: false;
        readonly properties: {
            readonly folderTrust: {
                readonly type: "object";
                readonly label: "Folder Trust";
                readonly category: "Security";
                readonly requiresRestart: false;
                readonly default: {};
                readonly description: "Settings for folder trust.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly enabled: {
                        readonly type: "boolean";
                        readonly label: "Folder Trust";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: false;
                        readonly description: "Setting to track whether Folder trust is enabled.";
                        readonly showInDialog: false;
                    };
                };
            };
            readonly auth: {
                readonly type: "object";
                readonly label: "Authentication";
                readonly category: "Security";
                readonly requiresRestart: true;
                readonly default: {};
                readonly description: "Authentication settings.";
                readonly showInDialog: false;
                readonly properties: {
                    readonly selectedType: {
                        readonly type: "string";
                        readonly label: "Selected Auth Type";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: AuthType | undefined;
                        readonly description: "The currently selected authentication type.";
                        readonly showInDialog: false;
                    };
                    readonly enforcedType: {
                        readonly type: "string";
                        readonly label: "Enforced Auth Type";
                        readonly category: "Advanced";
                        readonly requiresRestart: true;
                        readonly default: AuthType | undefined;
                        readonly description: "The required auth type. If this does not match the selected auth type, the user will be prompted to re-authenticate.";
                        readonly showInDialog: false;
                    };
                    readonly useExternal: {
                        readonly type: "boolean";
                        readonly label: "Use External Auth";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: boolean | undefined;
                        readonly description: "Whether to use an external authentication flow.";
                        readonly showInDialog: false;
                    };
                    readonly apiKey: {
                        readonly type: "string";
                        readonly label: "API Key";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: string | undefined;
                        readonly description: "API key for OpenAI compatible authentication.";
                        readonly showInDialog: false;
                    };
                    readonly baseUrl: {
                        readonly type: "string";
                        readonly label: "Base URL";
                        readonly category: "Security";
                        readonly requiresRestart: true;
                        readonly default: string | undefined;
                        readonly description: "Base URL for OpenAI compatible API.";
                        readonly showInDialog: false;
                    };
                };
            };
        };
    };
    readonly advanced: {
        readonly type: "object";
        readonly label: "Advanced";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Advanced settings for power users.";
        readonly showInDialog: false;
        readonly properties: {
            readonly autoConfigureMemory: {
                readonly type: "boolean";
                readonly label: "Auto Configure Max Old Space Size";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: false;
                readonly description: "Automatically configure Node.js memory limits";
                readonly showInDialog: false;
            };
            readonly dnsResolutionOrder: {
                readonly type: "string";
                readonly label: "DNS Resolution Order";
                readonly category: "Advanced";
                readonly requiresRestart: true;
                readonly default: DnsResolutionOrder | undefined;
                readonly description: "The DNS resolution order.";
                readonly showInDialog: false;
            };
            readonly excludedEnvVars: {
                readonly type: "array";
                readonly label: "Excluded Project Environment Variables";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string[];
                readonly description: "Environment variables to exclude from project context.";
                readonly showInDialog: false;
                readonly mergeStrategy: MergeStrategy.UNION;
            };
            readonly bugCommand: {
                readonly type: "object";
                readonly label: "Bug Command";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: BugCommandSettings | undefined;
                readonly description: "Configuration for the bug report command.";
                readonly showInDialog: false;
            };
            readonly tavilyApiKey: {
                readonly type: "string";
                readonly label: "Tavily API Key (Deprecated)";
                readonly category: "Advanced";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "⚠️ DEPRECATED: Please use webSearch.provider configuration instead. Legacy API key for the Tavily API.";
                readonly showInDialog: false;
            };
        };
    };
    readonly webSearch: {
        readonly type: "object";
        readonly label: "Web Search";
        readonly category: "Advanced";
        readonly requiresRestart: true;
        readonly default: {
            provider: Array<{
                type: "tavily" | "google" | "dashscope";
                apiKey?: string;
                searchEngineId?: string;
            }>;
            default: string;
        } | undefined;
        readonly description: "Configuration for web search providers.";
        readonly showInDialog: false;
    };
    readonly experimental: {
        readonly type: "object";
        readonly label: "Experimental";
        readonly category: "Experimental";
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: "Setting to enable experimental features";
        readonly showInDialog: false;
        readonly properties: {
            readonly visionModelPreview: {
                readonly type: "boolean";
                readonly label: "Vision Model Preview";
                readonly category: "Experimental";
                readonly requiresRestart: false;
                readonly default: true;
                readonly description: "Enable vision model support and auto-switching functionality. When disabled, vision models like qwen-vl-max-latest will be hidden and auto-switching will not occur.";
                readonly showInDialog: false;
            };
            readonly vlmSwitchMode: {
                readonly type: "string";
                readonly label: "VLM Switch Mode";
                readonly category: "Experimental";
                readonly requiresRestart: false;
                readonly default: string | undefined;
                readonly description: "Default behavior when images are detected in input. Values: once (one-time switch), session (switch for entire session), persist (continue with current model). If not set, user will be prompted each time. This is a temporary experimental feature.";
                readonly showInDialog: false;
            };
        };
    };
};
export type SettingsSchemaType = typeof SETTINGS_SCHEMA;
export declare function getSettingsSchema(): SettingsSchemaType;
type InferSettings<T extends SettingsSchema> = {
    -readonly [K in keyof T]?: T[K] extends {
        properties: SettingsSchema;
    } ? InferSettings<T[K]['properties']> : T[K]['type'] extends 'enum' ? T[K]['options'] extends readonly SettingEnumOption[] ? T[K]['options'][number]['value'] : T[K]['default'] : T[K]['default'] extends boolean ? boolean : T[K]['default'];
};
export type Settings = InferSettings<SettingsSchemaType>;
export {};
