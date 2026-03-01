/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  ToolNames,
  ToolDisplayNames,
  ToolNamesMigration,
  ToolDisplayNamesMigration,
  ToolAliases,
  DynamicAliases,
  resolveToolAlias,
  type ToolName,
} from './tool-names.js';

describe('ToolNames', () => {
  it('should have correct EDIT name', () => {
    expect(ToolNames.EDIT).toBe('edit');
  });

  it('should have correct WRITE_FILE name', () => {
    expect(ToolNames.WRITE_FILE).toBe('write_file');
  });

  it('should have correct READ_FILE name', () => {
    expect(ToolNames.READ_FILE).toBe('read_file');
  });

  it('should have correct READ_MANY_FILES name', () => {
    expect(ToolNames.READ_MANY_FILES).toBe('read_many_files');
  });

  it('should have correct GREP name', () => {
    expect(ToolNames.GREP).toBe('grep_search');
  });

  it('should have correct GLOB name', () => {
    expect(ToolNames.GLOB).toBe('glob');
  });

  it('should have correct SHELL name', () => {
    expect(ToolNames.SHELL).toBe('run_shell_command');
  });

  it('should have correct TODO_WRITE name', () => {
    expect(ToolNames.TODO_WRITE).toBe('todo_write');
  });

  it('should have correct MEMORY name', () => {
    expect(ToolNames.MEMORY).toBe('save_memory');
  });

  it('should have correct TASK name', () => {
    expect(ToolNames.TASK).toBe('task');
  });

  it('should have correct SKILL name', () => {
    expect(ToolNames.SKILL).toBe('skill');
  });

  it('should have correct EXIT_PLAN_MODE name', () => {
    expect(ToolNames.EXIT_PLAN_MODE).toBe('exit_plan_mode');
  });

  it('should have correct WEB_FETCH name', () => {
    expect(ToolNames.WEB_FETCH).toBe('web_fetch');
  });

  it('should have correct WEB_SEARCH name', () => {
    expect(ToolNames.WEB_SEARCH).toBe('web_search');
  });

  it('should have correct LS name', () => {
    expect(ToolNames.LS).toBe('list_directory');
  });

  it('should have correct LSP name', () => {
    expect(ToolNames.LSP).toBe('lsp');
  });

  it('should have correct language tool names', () => {
    expect(ToolNames.PYTHON).toBe('python_dev');
    expect(ToolNames.NODEJS).toBe('nodejs_dev');
    expect(ToolNames.GOLANG).toBe('golang_dev');
    expect(ToolNames.PHP).toBe('php_dev');
    expect(ToolNames.JAVA).toBe('java_dev');
    expect(ToolNames.CPP).toBe('cpp_dev');
    expect(ToolNames.RUST).toBe('rust_dev');
    expect(ToolNames.SWIFT).toBe('swift_dev');
    expect(ToolNames.TYPESCRIPT).toBe('typescript_dev');
  });
});

describe('ToolDisplayNames', () => {
  it('should have correct EDIT display name', () => {
    expect(ToolDisplayNames.EDIT).toBe('Edit');
  });

  it('should have correct WRITE_FILE display name', () => {
    expect(ToolDisplayNames.WRITE_FILE).toBe('WriteFile');
  });

  it('should have correct READ_FILE display name', () => {
    expect(ToolDisplayNames.READ_FILE).toBe('ReadFile');
  });

  it('should have correct READ_MANY_FILES display name', () => {
    expect(ToolDisplayNames.READ_MANY_FILES).toBe('ReadManyFiles');
  });

  it('should have correct GREP display name', () => {
    expect(ToolDisplayNames.GREP).toBe('Grep');
  });

  it('should have correct GLOB display name', () => {
    expect(ToolDisplayNames.GLOB).toBe('Glob');
  });

  it('should have correct SHELL display name', () => {
    expect(ToolDisplayNames.SHELL).toBe('Shell');
  });

  it('should have correct language tool display names', () => {
    expect(ToolDisplayNames.PYTHON).toBe('PythonDev');
    expect(ToolDisplayNames.NODEJS).toBe('NodeJsDev');
    expect(ToolDisplayNames.GOLANG).toBe('GolangDev');
    expect(ToolDisplayNames.PHP).toBe('PHPDev');
    expect(ToolDisplayNames.JAVA).toBe('JavaDev');
    expect(ToolDisplayNames.CPP).toBe('CppDev');
    expect(ToolDisplayNames.RUST).toBe('RustDev');
    expect(ToolDisplayNames.SWIFT).toBe('SwiftDev');
    expect(ToolDisplayNames.TYPESCRIPT).toBe('TypeScriptDev');
  });
});

describe('ToolNamesMigration', () => {
  it('should map search_file_content to GREP', () => {
    expect(ToolNamesMigration.search_file_content).toBe(ToolNames.GREP);
  });

  it('should map replace to EDIT', () => {
    expect(ToolNamesMigration.replace).toBe(ToolNames.EDIT);
  });
});

describe('ToolDisplayNamesMigration', () => {
  it('should map SearchFiles to GREP', () => {
    expect(ToolDisplayNamesMigration.SearchFiles).toBe(ToolDisplayNames.GREP);
  });

  it('should map FindFiles to GLOB', () => {
    expect(ToolDisplayNamesMigration.FindFiles).toBe(ToolDisplayNames.GLOB);
  });

  it('should map ReadFolder to LS', () => {
    expect(ToolDisplayNamesMigration.ReadFolder).toBe(ToolDisplayNames.LS);
  });
});

describe('ToolAliases', () => {
  describe('Shell aliases', () => {
    it('should map "run" to SHELL', () => {
      expect(ToolAliases.run).toBe(ToolNames.SHELL);
    });

    it('should map "shell" to SHELL', () => {
      expect(ToolAliases.shell).toBe(ToolNames.SHELL);
    });

    it('should map "exec" to SHELL', () => {
      expect(ToolAliases.exec).toBe(ToolNames.SHELL);
    });

    it('should map "bash" to SHELL', () => {
      expect(ToolAliases.bash).toBe(ToolNames.SHELL);
    });

    it('should map "terminal" to SHELL', () => {
      expect(ToolAliases.terminal).toBe(ToolNames.SHELL);
    });
  });

  describe('Edit aliases', () => {
    it('should map "edit" to EDIT', () => {
      expect(ToolAliases.edit).toBe(ToolNames.EDIT);
    });

    it('should map "replace" to EDIT', () => {
      expect(ToolAliases.replace).toBe(ToolNames.EDIT);
    });

    it('should map "modify" to EDIT', () => {
      expect(ToolAliases.modify).toBe(ToolNames.EDIT);
    });

    it('should map "patch" to EDIT', () => {
      expect(ToolAliases.patch).toBe(ToolNames.EDIT);
    });
  });

  describe('Read file aliases', () => {
    it('should map "read" to READ_FILE', () => {
      expect(ToolAliases.read).toBe(ToolNames.READ_FILE);
    });

    it('should map "cat_file" to READ_FILE', () => {
      expect(ToolAliases.cat_file).toBe(ToolNames.READ_FILE);
    });

    it('should map "open" to READ_FILE', () => {
      expect(ToolAliases.open).toBe(ToolNames.READ_FILE);
    });
  });

  describe('Read many files aliases', () => {
    it('should map "readmany" to READ_MANY_FILES', () => {
      expect(ToolAliases.readmany).toBe(ToolNames.READ_MANY_FILES);
    });

    it('should map "read_all" to READ_MANY_FILES', () => {
      expect(ToolAliases.read_all).toBe(ToolNames.READ_MANY_FILES);
    });

    it('should map "cat" to READ_MANY_FILES', () => {
      expect(ToolAliases.cat).toBe(ToolNames.READ_MANY_FILES);
    });
  });

  describe('Grep aliases', () => {
    it('should map "grep" to GREP', () => {
      expect(ToolAliases.grep).toBe(ToolNames.GREP);
    });

    it('should map "search" to GREP', () => {
      expect(ToolAliases.search).toBe(ToolNames.GREP);
    });

    it('should map "find" to GREP', () => {
      expect(ToolAliases.find).toBe(ToolNames.GREP);
    });

    it('should map "rg" to GREP', () => {
      expect(ToolAliases.rg).toBe(ToolNames.GREP);
    });
  });

  describe('Glob aliases', () => {
    it('should map "glob" to GLOB', () => {
      expect(ToolAliases.glob).toBe(ToolNames.GLOB);
    });

    it('should map "files" to GLOB', () => {
      expect(ToolAliases.files).toBe(ToolNames.GLOB);
    });

    it('should map "find_files" to GLOB', () => {
      expect(ToolAliases.find_files).toBe(ToolNames.GLOB);
    });
  });

  describe('Language tool aliases', () => {
    it('should map "python" to PYTHON', () => {
      expect(ToolAliases.python).toBe(ToolNames.PYTHON);
    });

    it('should map "py" to PYTHON', () => {
      expect(ToolAliases.py).toBe(ToolNames.PYTHON);
    });

    it('should map "node" to NODEJS', () => {
      expect(ToolAliases.node).toBe(ToolNames.NODEJS);
    });

    it('should map "npm" to NODEJS', () => {
      expect(ToolAliases.npm).toBe(ToolNames.NODEJS);
    });

    it('should map "go" to GOLANG', () => {
      expect(ToolAliases.go).toBe(ToolNames.GOLANG);
    });

    it('should map "java" to JAVA', () => {
      expect(ToolAliases.java).toBe(ToolNames.JAVA);
    });

    it('should map "maven" to JAVA', () => {
      expect(ToolAliases.maven).toBe(ToolNames.JAVA);
    });

    it('should map "gradle" to JAVA', () => {
      expect(ToolAliases.gradle).toBe(ToolNames.JAVA);
    });

    it('should map "cpp" to CPP', () => {
      expect(ToolAliases.cpp).toBe(ToolNames.CPP);
    });

    it('should map "cmake" to CPP', () => {
      expect(ToolAliases.cmake).toBe(ToolNames.CPP);
    });

    it('should map "rust" to RUST', () => {
      expect(ToolAliases.rust).toBe(ToolNames.RUST);
    });

    it('should map "cargo" to RUST', () => {
      expect(ToolAliases.cargo).toBe(ToolNames.RUST);
    });

    it('should map "swift" to SWIFT', () => {
      expect(ToolAliases.swift).toBe(ToolNames.SWIFT);
    });

    it('should map "ts" to TYPESCRIPT', () => {
      expect(ToolAliases.ts).toBe(ToolNames.TYPESCRIPT);
    });

    it('should map "tsc" to TYPESCRIPT', () => {
      expect(ToolAliases.tsc).toBe(ToolNames.TYPESCRIPT);
    });
  });
});

describe('DynamicAliases', () => {
  it('should be an empty object by default', () => {
    expect(DynamicAliases).toEqual({});
  });
});

describe('resolveToolAlias', () => {
  it('should resolve shell aliases', () => {
    expect(resolveToolAlias('run')).toBe(ToolNames.SHELL);
    expect(resolveToolAlias('bash')).toBe(ToolNames.SHELL);
    expect(resolveToolAlias('terminal')).toBe(ToolNames.SHELL);
  });

  it('should resolve edit aliases', () => {
    expect(resolveToolAlias('edit')).toBe(ToolNames.EDIT);
    expect(resolveToolAlias('replace')).toBe(ToolNames.EDIT);
    expect(resolveToolAlias('modify')).toBe(ToolNames.EDIT);
  });

  it('should resolve read file aliases', () => {
    expect(resolveToolAlias('read')).toBe(ToolNames.READ_FILE);
    expect(resolveToolAlias('open')).toBe(ToolNames.READ_FILE);
  });

  it('should resolve grep aliases', () => {
    expect(resolveToolAlias('grep')).toBe(ToolNames.GREP);
    expect(resolveToolAlias('search')).toBe(ToolNames.GREP);
    expect(resolveToolAlias('rg')).toBe(ToolNames.GREP);
  });

  it('should resolve glob aliases', () => {
    expect(resolveToolAlias('glob')).toBe(ToolNames.GLOB);
    expect(resolveToolAlias('files')).toBe(ToolNames.GLOB);
  });

  it('should resolve language tool aliases', () => {
    expect(resolveToolAlias('python')).toBe(ToolNames.PYTHON);
    expect(resolveToolAlias('py')).toBe(ToolNames.PYTHON);
    expect(resolveToolAlias('node')).toBe(ToolNames.NODEJS);
    expect(resolveToolAlias('go')).toBe(ToolNames.GOLANG);
    expect(resolveToolAlias('java')).toBe(ToolNames.JAVA);
    expect(resolveToolAlias('cpp')).toBe(ToolNames.CPP);
    expect(resolveToolAlias('rust')).toBe(ToolNames.RUST);
    expect(resolveToolAlias('swift')).toBe(ToolNames.SWIFT);
    expect(resolveToolAlias('ts')).toBe(ToolNames.TYPESCRIPT);
  });

  it('should return original name if no alias found', () => {
    expect(resolveToolAlias('unknown_tool')).toBe('unknown_tool');
    expect(resolveToolAlias('custom_command')).toBe('custom_command');
  });

  it('should handle case-insensitive aliases', () => {
    expect(resolveToolAlias('RUN')).toBe(ToolNames.SHELL);
    expect(resolveToolAlias('Bash')).toBe(ToolNames.SHELL);
    expect(resolveToolAlias('PYTHON')).toBe(ToolNames.PYTHON);
  });

  it('should handle whitespace in alias', () => {
    expect(resolveToolAlias('  run  ')).toBe(ToolNames.SHELL);
    expect(resolveToolAlias('\tgrep\t')).toBe(ToolNames.GREP);
  });

  it('should resolve canonical names directly', () => {
    expect(resolveToolAlias('edit')).toBe(ToolNames.EDIT);
    expect(resolveToolAlias('write_file')).toBe(ToolNames.WRITE_FILE);
    expect(resolveToolAlias('read_file')).toBe(ToolNames.READ_FILE);
    expect(resolveToolAlias('run_shell_command')).toBe(ToolNames.SHELL);
  });
});

describe('ToolName Type', () => {
  it('should be assignable from ToolNames values', () => {
    const name: ToolName = ToolNames.EDIT;
    expect(name).toBe('edit');
  });

  it('should be usable in function signatures', () => {
    function getToolByName(name: ToolName): string {
      return name;
    }
    expect(getToolByName(ToolNames.SHELL)).toBe('run_shell_command');
  });
});
