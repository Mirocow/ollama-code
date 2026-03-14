# Ollama Code - Complete Tools Demo

This example demonstrates usage of ALL 46+ builtin tools across 16 plugins.

## Quick Start

```bash
cd /home/z/my-project/ollama-code
ollama-code
```

Then paste the prompt from `demo-prompt.md`.

## Tools Coverage

| Plugin | Tools | Count |
|--------|-------|-------|
| core-tools | echo, timestamp, get_env | 3 |
| file-tools | read_file, write_file, edit, list_directory, glob, read_many_files | 6 |
| shell-tools | run_shell_command | 1 |
| git-tools | git_advanced, git_smart, git_workflow | 3 |
| search-tools | grep_search, web_search, web_fetch | 3 |
| dev-tools | python_dev, nodejs_dev, golang_dev, rust_dev, typescript_dev, java_dev, cpp_dev, swift_dev, php_dev | 9 |
| database-tools | database, redis, docker, docker_project | 4 |
| code-analysis-tools | code_analyzer, find_unused_exports, analyze_dependencies, detect_dead_code, diagram_generator | 5 |
| memory-tools | save_memory | 1 |
| productivity-tools | todo_write, exit_plan_mode | 2 |
| agent-tools | task, skill | 2 |
| ssh-tools | ssh_connect, ssh_add_host, ssh_list_hosts, ssh_remove_host | 4 |
| lsp-tools | lsp | 1 |
| api-tools | api_tester | 1 |
| storage-tools | model_storage | 1 |
| mcp-tools | (dynamic) | - |

**Total: 46 tools**
