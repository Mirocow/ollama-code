declare module 'simple-git' {
  export interface SimpleGit {
    checkIsRepo(action?: CheckRepoActions): Promise<boolean>;
    status(): Promise<StatusResult>;
    log(options?: string | LogOptions): Promise<LogResult>;
    diff(options?: string | string[]): Promise<string>;
    add(files: string | string[]): Promise<string>;
    commit(message: string, options?: CommitOptions): Promise<CommitResult>;
    push(remote?: string, branch?: string): Promise<string>;
    pull(remote?: string, branch?: string): Promise<string>;
    checkout(branch: string): Promise<string>;
    checkoutBranch(branch: string, startPoint: string): Promise<string>;
    checkoutLocalBranch(branch: string): Promise<string>;
    branch(options?: string | BranchOptions): Promise<BranchSummary>;
    merge(options: string | MergeOptions): Promise<MergeResult>;
    fetch(remote?: string, branch?: string): Promise<FetchResult>;
    remote(args: string[]): Promise<string>;
    revparse(options?: string | string[]): Promise<string>;
    show(options: string): Promise<string>;
    cwd(path: string): Promise<string>;
    init(bare?: boolean, options?: InitOptions): Promise<string>;
    clone(
      repoPath: string,
      localPath: string,
      options?: string[],
    ): Promise<string>;
    addRemote(name: string, repo: string): Promise<string>;
    getRemotes(verbose?: boolean): Promise<RemoteWithRefs[]>;
    listRemote(args?: string[]): Promise<string>;
    raw(...args: string[]): Promise<string>;
    raw(args: string[]): Promise<string>;
    addConfig(key: string, value: string): Promise<string>;
    env(envVars: Record<string, string>): SimpleGit;
    clean(mode: string, options?: string[]): Promise<string>;
  }

  export interface CommitOptions {
    [key: string]: string | null | undefined;
  }

  export interface InitOptions {
    [key: string]: string | null | undefined;
  }

  export interface StatusResult {
    current: string | null;
    tracking: string | null;
    files: FileStatusResult[];
    staged: FileStatusResult[];
    ahead: number;
    behind: number;
    conflicted: string[];
    created: string[];
    deleted: string[];
    modified: string[];
    renamed: FileStatusResult[];
    not_added: string[];
  }

  export interface FileStatusResult {
    path: string;
    index: string;
    working_dir: string;
  }

  export interface LogResult {
    latest: LogLine | null;
    total: number;
    all: LogLine[];
  }

  export interface LogLine {
    hash: string;
    date: string;
    message: string;
    refs: string;
    body: string;
    author_name: string;
    author_email: string;
  }

  export interface LogOptions {
    file?: string;
    from?: string;
    to?: string;
    maxCount?: number;
  }

  export interface CommitResult {
    author: string | null;
    branch: string;
    commit: string;
    root: boolean;
    summary: {
      changes: number;
      insertions: number;
      deletions: number;
    };
  }

  export interface BranchSummary {
    branches: { [key: string]: BranchSummaryBranch };
    current: string;
    detached: boolean;
  }

  export interface BranchSummaryBranch {
    current: boolean;
    name: string;
    commit: string;
    label: string;
  }

  export interface BranchOptions {
    [key: string]: string | boolean | number;
  }

  export interface MergeResult {
    mergedMessages: string[];
    merges: string[];
    result: string;
  }

  export interface MergeOptions {
    [key: string]: string | boolean | number;
  }

  export interface FetchResult {
    raw: string;
    remote: string | null;
    branches: Array<{ name: string; tracking: string }>;
    tags: Array<{ name: string; tracking: string }>;
  }

  export interface RemoteWithRefs {
    name: string;
    refs: { fetch: string; push: string };
  }

  export const CheckRepoActions: {
    BARE: 'bare';
    IN_TREE: 'in-tree';
    IS_REPO_ROOT: 'is-repo-root';
  };

  export function simpleGit(basePath?: string): SimpleGit;
}
