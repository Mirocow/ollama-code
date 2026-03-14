# Real-World Scenario: Full Project Audit

This scenario uses 30+ tools in a realistic workflow.

## Prompt

```
Perform a comprehensive project audit of this codebase: /home/z/my-project/ollama-code

## Phase 1: Project Discovery (File + Search Tools)

1. Use `list_directory` to explore the root structure
2. Use `glob` to find all TypeScript source files
3. Use `grep_search` to find all TODO comments in the codebase
4. Use `read_many_files` to read all package.json files
5. Use `web_fetch` to check the npm registry for outdated packages

## Phase 2: Code Quality (Analysis Tools)

6. Use `code_analyzer` to analyze code quality metrics
7. Use `find_unused_exports` to identify dead exports
8. Use `detect_dead_code` to find unreachable code
9. Use `analyze_dependencies` to map dependency relationships
10. Use `diagram_generator` to create architecture diagram

## Phase 3: Version Control (Git Tools)

11. Use `git_smart` to show current branch and uncommitted changes
12. Use `git_advanced` to show commit history and contributors
13. Use `git_workflow` to analyze branch structure

## Phase 4: Development Environment (Dev Tools)

14. Use `typescript_dev` to run type checking
15. Use `nodejs_dev` to check Node.js compatibility
16. Use `python_dev` to check if Python tools are available

## Phase 5: Infrastructure (Docker + Database Tools)

17. Use `docker` to check containerization setup
18. Use `docker_project` to analyze docker-compose configuration
19. Use `database` to check database connections
20. Use `redis` to check cache layer

## Phase 6: API & Network (API + SSH Tools)

21. Use `api_tester` to test any API endpoints
22. Use `ssh_list_hosts` to check deployment targets
23. Use `lsp` to verify language server setup

## Phase 7: Automation (Agent + Memory Tools)

24. Use `task` to create a subagent for security audit
25. Use `skill` to apply relevant skills
26. Use `save_memory` to save audit results

## Phase 8: Reporting (Productivity + Core Tools)

27. Use `todo_write` to create action items from findings
28. Use `write_file` to generate audit report
29. Use `timestamp` to record audit time
30. Use `run_shell_command` to format the final report

## Deliverable

At the end, provide:
1. Executive summary of findings
2. Critical issues requiring immediate attention
3. Recommendations for improvement
4. Full tool usage report showing which tools were used
```

## Tools Used in This Scenario

| Phase | Tools | Count |
|-------|-------|-------|
| Discovery | list_directory, glob, grep_search, read_many_files, web_fetch | 5 |
| Quality | code_analyzer, find_unused_exports, detect_dead_code, analyze_dependencies, diagram_generator | 5 |
| Git | git_smart, git_advanced, git_workflow | 3 |
| Dev | typescript_dev, nodejs_dev, python_dev | 3 |
| Infra | docker, docker_project, database, redis | 4 |
| Network | api_tester, ssh_list_hosts, lsp | 3 |
| Automation | task, skill, save_memory | 3 |
| Reporting | todo_write, write_file, timestamp, run_shell_command | 4 |

**Total: 30 tools**
