/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getLanguageFromFilePath } from './language-detection.js';

describe('getLanguageFromFilePath', () => {
  describe('common languages', () => {
    it('should detect TypeScript', () => {
      expect(getLanguageFromFilePath('file.ts')).toBe('TypeScript');
      expect(getLanguageFromFilePath('file.tsx')).toBe('TypeScript');
    });

    it('should detect JavaScript', () => {
      expect(getLanguageFromFilePath('file.js')).toBe('JavaScript');
      expect(getLanguageFromFilePath('file.mjs')).toBe('JavaScript');
      expect(getLanguageFromFilePath('file.cjs')).toBe('JavaScript');
      expect(getLanguageFromFilePath('file.jsx')).toBe('JavaScript');
    });

    it('should detect Python', () => {
      expect(getLanguageFromFilePath('file.py')).toBe('Python');
    });

    it('should detect Java', () => {
      expect(getLanguageFromFilePath('file.java')).toBe('Java');
    });

    it('should detect Go', () => {
      expect(getLanguageFromFilePath('file.go')).toBe('Go');
    });

    it('should detect Ruby', () => {
      expect(getLanguageFromFilePath('file.rb')).toBe('Ruby');
    });

    it('should detect PHP', () => {
      expect(getLanguageFromFilePath('file.php')).toBe('PHP');
      expect(getLanguageFromFilePath('file.phtml')).toBe('PHP');
    });

    it('should detect C#', () => {
      expect(getLanguageFromFilePath('file.cs')).toBe('C#');
    });

    it('should detect C++', () => {
      expect(getLanguageFromFilePath('file.cpp')).toBe('C++');
      expect(getLanguageFromFilePath('file.cxx')).toBe('C++');
      expect(getLanguageFromFilePath('file.cc')).toBe('C++');
      expect(getLanguageFromFilePath('file.hpp')).toBe('C++');
    });

    it('should detect C', () => {
      expect(getLanguageFromFilePath('file.c')).toBe('C');
      expect(getLanguageFromFilePath('file.h')).toBe('C/C++');
    });

    it('should detect Rust', () => {
      expect(getLanguageFromFilePath('file.rs')).toBe('Rust');
    });

    it('should detect Swift', () => {
      expect(getLanguageFromFilePath('file.swift')).toBe('Swift');
    });

    it('should detect Kotlin', () => {
      expect(getLanguageFromFilePath('file.kt')).toBe('Kotlin');
    });
  });

  describe('web technologies', () => {
    it('should detect HTML', () => {
      expect(getLanguageFromFilePath('file.html')).toBe('HTML');
      expect(getLanguageFromFilePath('file.htm')).toBe('HTML');
    });

    it('should detect CSS', () => {
      expect(getLanguageFromFilePath('file.css')).toBe('CSS');
    });

    it('should detect Sass/Less', () => {
      expect(getLanguageFromFilePath('file.less')).toBe('Less');
      expect(getLanguageFromFilePath('file.sass')).toBe('Sass');
      expect(getLanguageFromFilePath('file.scss')).toBe('Sass');
    });

    it('should detect Vue', () => {
      expect(getLanguageFromFilePath('file.vue')).toBe('Vue');
    });

    it('should detect Svelte', () => {
      expect(getLanguageFromFilePath('file.svelte')).toBe('Svelte');
    });
  });

  describe('data formats', () => {
    it('should detect JSON', () => {
      expect(getLanguageFromFilePath('file.json')).toBe('JSON');
    });

    it('should detect XML', () => {
      expect(getLanguageFromFilePath('file.xml')).toBe('XML');
    });

    it('should detect YAML', () => {
      expect(getLanguageFromFilePath('file.yaml')).toBe('YAML');
      expect(getLanguageFromFilePath('file.yml')).toBe('YAML');
    });

    it('should detect TOML', () => {
      expect(getLanguageFromFilePath('file.toml')).toBe('TOML');
    });

    it('should detect Markdown', () => {
      expect(getLanguageFromFilePath('file.md')).toBe('Markdown');
      expect(getLanguageFromFilePath('file.markdown')).toBe('Markdown');
    });
  });

  describe('shell and scripting', () => {
    it('should detect Shell', () => {
      expect(getLanguageFromFilePath('file.sh')).toBe('Shell');
    });

    it('should detect PowerShell', () => {
      expect(getLanguageFromFilePath('file.ps1')).toBe('PowerShell');
    });

    it('should detect Batch', () => {
      expect(getLanguageFromFilePath('file.bat')).toBe('Batch');
      expect(getLanguageFromFilePath('file.cmd')).toBe('Batch');
    });
  });

  describe('database', () => {
    it('should detect SQL', () => {
      expect(getLanguageFromFilePath('file.sql')).toBe('SQL');
    });
  });

  describe('functional languages', () => {
    it('should detect Haskell', () => {
      expect(getLanguageFromFilePath('file.hs')).toBe('Haskell');
    });

    it('should detect Clojure', () => {
      expect(getLanguageFromFilePath('file.clj')).toBe('Clojure');
      expect(getLanguageFromFilePath('file.cljs')).toBe('Clojure');
    });

    it('should detect Elixir', () => {
      expect(getLanguageFromFilePath('file.ex')).toBe('Elixir');
    });

    it('should detect Erlang', () => {
      expect(getLanguageFromFilePath('file.erl')).toBe('Erlang');
    });

    it('should detect F#', () => {
      expect(getLanguageFromFilePath('file.fs')).toBe('F#');
    });
  });

  describe('config files', () => {
    it('should detect Dockerfile', () => {
      expect(getLanguageFromFilePath('Dockerfile')).toBe('Dockerfile');
    });

    it('should detect .gitignore', () => {
      expect(getLanguageFromFilePath('.gitignore')).toBe('Git');
    });

    it('should detect .dockerignore', () => {
      expect(getLanguageFromFilePath('.dockerignore')).toBe('Docker');
    });

    it('should detect .npmignore', () => {
      expect(getLanguageFromFilePath('.npmignore')).toBe('npm');
    });

    it('should detect .editorconfig', () => {
      expect(getLanguageFromFilePath('.editorconfig')).toBe('EditorConfig');
    });

    it('should detect .prettierrc', () => {
      expect(getLanguageFromFilePath('.prettierrc')).toBe('Prettier');
    });

    it('should detect .eslintrc', () => {
      expect(getLanguageFromFilePath('.eslintrc')).toBe('ESLint');
    });

    it('should detect .babelrc', () => {
      expect(getLanguageFromFilePath('.babelrc')).toBe('Babel');
    });
  });

  describe('template engines', () => {
    it('should detect Handlebars', () => {
      expect(getLanguageFromFilePath('file.hbs')).toBe('Handlebars');
    });

    it('should detect EJS', () => {
      expect(getLanguageFromFilePath('file.ejs')).toBe('EJS');
    });

    it('should detect ERB', () => {
      expect(getLanguageFromFilePath('file.erb')).toBe('ERB');
    });

    it('should detect JSP', () => {
      expect(getLanguageFromFilePath('file.jsp')).toBe('JSP');
    });
  });

  describe('edge cases', () => {
    it('should return undefined for unknown extensions', () => {
      expect(getLanguageFromFilePath('file.unknown')).toBeUndefined();
      expect(getLanguageFromFilePath('file.xyz')).toBeUndefined();
    });

    it('should be case insensitive', () => {
      expect(getLanguageFromFilePath('file.TS')).toBe('TypeScript');
      expect(getLanguageFromFilePath('file.JS')).toBe('JavaScript');
      expect(getLanguageFromFilePath('file.PY')).toBe('Python');
    });

    it('should handle paths with directories', () => {
      expect(getLanguageFromFilePath('/path/to/file.ts')).toBe('TypeScript');
      expect(getLanguageFromFilePath('./src/utils/file.py')).toBe('Python');
      expect(getLanguageFromFilePath('../test/file.rs')).toBe('Rust');
    });

    it('should handle files without extensions', () => {
      expect(getLanguageFromFilePath('Dockerfile')).toBe('Dockerfile');
      expect(getLanguageFromFilePath('Makefile')).toBeUndefined();
    });

    it('should handle files with multiple dots', () => {
      expect(getLanguageFromFilePath('test.spec.ts')).toBe('TypeScript');
      expect(getLanguageFromFilePath('config.test.js')).toBe('JavaScript');
    });

    it('should handle empty string', () => {
      expect(getLanguageFromFilePath('')).toBeUndefined();
    });
  });
});
