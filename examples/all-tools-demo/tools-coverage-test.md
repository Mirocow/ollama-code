# Tools Coverage Test Script

This script tests ALL tools systematically and reports coverage.

## Run this single comprehensive prompt:

```
I need a comprehensive test of ALL ollama-code tools. Please execute each tool and report success/failure.

## Test Plan

Create a todo list tracking our progress:
- [ ] Core Tools (echo, timestamp, get_env)
- [ ] File Tools (read_file, write_file, edit, list_directory, glob, read_many_files)
- [ ] Shell Tools (run_shell_command)
- [ ] Git Tools (git_smart, git_advanced, git_workflow)
- [ ] Search Tools (grep_search, web_search, web_fetch)
- [ ] Dev Tools (python_dev, nodejs_dev, typescript_dev, golang_dev, rust_dev, java_dev, cpp_dev, swift_dev, php_dev)
- [ ] Database Tools (database, redis, docker, docker_project)
- [ ] Code Analysis Tools (code_analyzer, find_unused_exports, analyze_dependencies, detect_dead_code, diagram_generator)
- [ ] Memory Tools (save_memory)
- [ ] Productivity Tools (todo_write, exit_plan_mode)
- [ ] Agent Tools (task, skill)
- [ ] SSH Tools (ssh_list_hosts, ssh_add_host, ssh_connect, ssh_remove_host)
- [ ] LSP Tools (lsp)
- [ ] API Tools (api_tester)
- [ ] Storage Tools (model_storage)
- [ ] MCP Tools (list available)

## Execute Each Test

For each tool, run it and note:
- ✅ Success - tool executed correctly
- ❌ Failed - tool failed with error
- ⏭️ Skipped - tool not applicable (e.g., language not installed)

### Start Testing Now

Begin with core tools, then progress through each category. Keep a running count of:
- Total tools tested
- Successful tests
- Failed tests
- Skipped tests

At the end, provide a detailed report with coverage percentage.
```

## Expected Output Format

```
## Tools Test Report

### Summary
- Total Tools: 46
- Tested: X
- Successful: Y
- Failed: Z
- Skipped: N
- Coverage: XX%

### Details by Plugin

| Plugin | Tool | Status | Notes |
|--------|------|--------|-------|
| core-tools | echo | ✅ | Working |
| core-tools | timestamp | ✅ | Working |
| ... | ... | ... | ... |
```
