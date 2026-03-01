/**
 * Scenario Runner v3 — TypeScript Configuration-Driven Terminal Screenshots
 *
 * Configuration has only two core concepts: type (input) and capture (screenshot).
 * All intelligent waiting is handled automatically by the Runner.
 *
 * Usage:
 *   npx tsx integration-tests/terminal-capture/run.ts integration-tests/terminal-capture/scenarios/about.ts
 *   npx tsx integration-tests/terminal-capture/run.ts integration-tests/terminal-capture/scenarios/
 */
export interface FlowStep {
    /** Input text (auto-press Enter, auto-wait for output to stabilize, auto-screenshot before/after) */
    type?: string;
    /**
     * Send special key presses (no auto-Enter, no auto-screenshot)
     * Supported: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, Tab, Escape, Backspace, Space
     * Can also pass ANSI escape sequence strings
     */
    key?: string | string[];
    /** Explicit screenshot: current viewport (standalone capture when no type) */
    capture?: string;
    /** Explicit screenshot: full scrollback buffer long image (standalone capture when no type) */
    captureFull?: string;
}
export interface ScenarioConfig {
    /** Scenario name */
    name: string;
    /** Launch command, e.g., ["node", "dist/cli.js", "--yolo"] */
    spawn: string[];
    /** Execution flow: array, each item can contain type / capture / captureFull */
    flow: FlowStep[];
    /** Terminal configuration (all optional) */
    terminal?: {
        cols?: number;
        rows?: number;
        theme?: string;
        chrome?: boolean;
        title?: string;
        fontSize?: number;
        cwd?: string;
    };
    /** Screenshot output directory (relative to config file) */
    outputDir?: string;
}
export interface RunResult {
    name: string;
    screenshots: string[];
    success: boolean;
    error?: string;
    durationMs: number;
}
/** Dynamically load configuration from .ts file (supports single object or array) */
export declare function loadScenarios(tsPath: string): Promise<{
    configs: ScenarioConfig[];
    basedir: string;
}>;
/** Execute a single scenario */
export declare function runScenario(config: ScenarioConfig, basedir: string): Promise<RunResult>;
