# Complete Tools Demo Prompt

Paste this prompt to ollama-code to test all 46+ tools:

---

## Phase 1: Core & File Tools (9 tools)

```
I need you to demonstrate core and file tools. Please:

1. Use `echo` to say "Hello from ollama-code tools demo!"
2. Use `timestamp` to show current time
3. Use `get_env` to show the HOME environment variable
4. Use `list_directory` to show contents of /home/z/my-project/ollama-code/packages
5. Use `glob` to find all *.json files in /home/z/my-project/ollama-code/packages/core
6. Use `read_file` to read /home/z/my-project/ollama-code/package.json
7. Use `read_many_files` to read package.json from both core and cli packages
8. Use `write_file` to create /home/z/my-project/ollama-code/examples/all-tools-demo/test-output.txt with content "Test file created by write_file tool"
9. Use `edit` to change "Test file" to "Modified test file" in that file
```

## Phase 2: Shell & Git Tools (4 tools)

```
Now demonstrate shell and git tools:

1. Use `run_shell_command` to run "echo 'Shell test' && pwd && date"
2. Use `git_smart` to show current branch and status
3. Use `git_advanced` to show last 5 commits with author info
4. Use `git_workflow` to list branches
```

## Phase 3: Search Tools (3 tools)

```
Now demonstrate search tools:

1. Use `grep_search` to find all "export" occurrences in /home/z/my-project/ollama-code/packages/core/src/index.ts
2. Use `web_search` to search for "ollama code editor"
3. Use `web_fetch` to fetch content from https://github.com
```

## Phase 4: Development Tools (9 tools)

```
Demonstrate development tools for each language:

1. Use `python_dev` to run: print("Python dev tool works!")
2. Use `nodejs_dev` to run: console.log("Node.js dev tool works!")
3. Use `typescript_dev` to check types in this project
4. Use `golang_dev` to show version info (run: go version)
5. Use `rust_dev` to show cargo version (run: cargo --version)
6. Use `java_dev` to show java version (run: java -version)
7. Use `cpp_dev` to show gcc version (run: gcc --version)
8. Use `swift_dev` to show swift version if available
9. Use `php_dev` to show php version if available
```

## Phase 5: Database & Docker Tools (4 tools)

```
Demonstrate database and docker tools:

1. Use `docker` to list running containers (docker ps)
2. Use `docker_project` to show docker-compose projects
3. Use `redis` to connect and run PING command if redis is available
4. Use `database` to show available database connections
```

## Phase 6: Code Analysis Tools (5 tools)

```
Demonstrate code analysis tools:

1. Use `code_analyzer` to analyze /home/z/my-project/ollama-code/packages/core/src
2. Use `find_unused_exports` to find unused exports in core package
3. Use `analyze_dependencies` to show dependency tree
4. Use `detect_dead_code` to find dead code
5. Use `diagram_generator` to generate a diagram of the architecture
```

## Phase 7: Productivity Tools (2 tools)

```
Demonstrate productivity tools:

1. Use `todo_write` to create a todo list with these items:
   - [ ] Test core tools
   - [ ] Test file tools
   - [ ] Test shell tools
   - [ ] Test git tools
   - [x] Complete demo
2. Use `exit_plan_mode` to exit planning mode
```

## Phase 8: Memory & Agent Tools (3 tools)

```
Demonstrate memory and agent tools:

1. Use `save_memory` to save: "All tools demo completed successfully at [timestamp]"
2. Use `task` to create a subagent task for code review
3. Use `skill` to list available skills
```

## Phase 9: SSH & Network Tools (5 tools)

```
Demonstrate SSH and network tools:

1. Use `ssh_list_hosts` to show configured SSH hosts
2. Use `ssh_add_host` to add a test host (example.com)
3. Use `lsp` to show LSP capabilities
4. Use `api_tester` to test httpbin.org/get endpoint
5. Use `model_storage` to show model storage info
```

## Phase 10: MCP Tools (dynamic)

```
Demonstrate MCP tools:

1. List all available MCP tools
2. Use any MCP tool that is available
```

---

## Summary

After running all phases, provide a summary table:

| Plugin | Tools Tested | Status |
|--------|--------------|--------|
| core-tools | 3 | ? |
| file-tools | 6 | ? |
| shell-tools | 1 | ? |
| git-tools | 3 | ? |
| search-tools | 3 | ? |
| dev-tools | 9 | ? |
| database-tools | 4 | ? |
| code-analysis-tools | 5 | ? |
| memory-tools | 1 | ? |
| productivity-tools | 2 | ? |
| agent-tools | 2 | ? |
| ssh-tools | 4 | ? |
| lsp-tools | 1 | ? |
| api-tools | 1 | ? |
| storage-tools | 1 | ? |
| mcp-tools | ? | ? |
| **TOTAL** | **46+** | ? |
