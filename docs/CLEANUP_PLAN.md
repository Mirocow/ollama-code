# План очистки проекта Ollama Code

## 1. Неиспользуемые файлы

### 1.1 Резервные копии (*.bak)
| Файл | Расположение | Действие |
|------|--------------|----------|
| `prompts.ts.bak` | `packages/core/src/core/` | **Удалить** - дублирует `prompts.ts` |

### 1.2 Скомпилированные файлы в исходных директориях
В проекте обнаружены артефакты компиляции (.js, .d.ts, .js.map), которые не должны храниться в исходных директориях:

**Проблемные паттерны:**
```
packages/core/src/**/*.js
packages/core/src/**/*.d.ts
packages/core/src/**/*.js.map
packages/sdk-typescript/src/**/*.js
packages/sdk-typescript/src/**/*.d.ts
packages/sdk-typescript/src/**/*.js.map
packages/webui/src/**/*.js
packages/webui/src/**/*.d.ts
packages/webui/src/**/*.js.map
```

**Решение:** 
1. Добавить в `.gitignore`:
```gitignore
# Compiled files in source directories
packages/core/src/**/*.js
packages/core/src/**/*.d.ts
packages/core/src/**/*.js.map
packages/sdk-typescript/src/**/*.js
packages/sdk-typescript/src/**/*.d.ts
packages/sdk-typescript/src/**/*.js.map
packages/webui/src/**/*.js
packages/webui/src/**/*.d.ts
packages/webui/src/**/*.js.map
integration-tests/**/*.js
integration-tests/**/*.d.ts
integration-tests/**/*.js.map
docs/**/*.js
docs/**/*.d.ts
docs/**/*.js.map
scripts/**/*.js
scripts/**/*.js.map
```

2. Выполнить очистку:
```bash
find packages -name "*.js" -path "*/src/*" -delete
find packages -name "*.d.ts" -path "*/src/*" -delete
find packages -name "*.js.map" -path "*/src/*" -delete
```

### 1.3 Snapshot файлы тестов
Дублирующиеся snapshot файлы:
```
packages/core/src/tools/__snapshots__/shell.test.js.snap  # Удалить - дубликат shell.test.ts.snap
packages/core/src/core/__snapshots__/prompts.test.js.snap  # Удалить - дубликат prompts.test.ts.snap
```

### 1.4 Временные и сгенерированные файлы
| Паттерн | Описание | Действие |
|---------|----------|----------|
| `*.ts.snap` для `.js` файлов | Скомпилированные snapshots | Удалить |
| `toml-to-markdown-converter.test.js` | Скомпилированный тест | Удалить |

## 2. Структура для очистки

### 2.1 Файлы для немедленного удаления
```
packages/core/src/core/prompts.ts.bak
packages/core/src/tools/__snapshots__/shell.test.js.snap
packages/core/src/core/__snapshots__/prompts.test.js.snap
packages/core/src/utils/toml-to-markdown-converter.test.js
packages/core/src/utils/toml-to-markdown-converter.test.d.ts
```

### 2.2 Скрипт очистки
```bash
#!/bin/bash
# cleanup.sh

echo "Cleaning up backup files..."
find . -name "*.bak" -type f -delete

echo "Cleaning up compiled files in source directories..."
find ./packages -path "*/src/*.js" -type f -delete
find ./packages -path "*/src/*.d.ts" -type f -delete  
find ./packages -path "*/src/*.js.map" -type f -delete

echo "Cleaning up integration test compiled files..."
find ./integration-tests -name "*.js" -type f -delete
find ./integration-tests -name "*.d.ts" -type f -delete
find ./integration-tests -name "*.js.map" -type f -delete

echo "Cleaning up docs compiled files..."
find ./docs -name "*.js" -type f -delete
find ./docs -name "*.d.ts" -type f -delete
find ./docs -name "*.js.map" -type f -delete

echo "Cleanup complete!"
```

## 3. Обновление .gitignore

Добавить следующие паттерны:
```gitignore
# Backup files
*.bak
*.old
*.tmp

# Compiled output in source directories  
**/src/**/*.js
**/src/**/*.d.ts
**/src/**/*.js.map
!**/src/**/*.d.ts.map

# Test snapshots for JS (keep TS)
**/__snapshots__/*.js.snap

# Generated files
**/generated/*.js
**/generated/*.d.ts
```

## 4. Рекомендации по поддержанию чистоты

1. **Использовать `tsconfig.json` с `outDir`** - все скомпилированные файлы должны попадать в отдельную директорию
2. **Добавить pre-commit hook** - проверка на коммит `.bak`, `.old`, `.tmp` файлов
3. **CI проверка** - запуск `git clean -Xdry-run` для обнаружения неигнорируемых артефактов

## 5. Метрики

| Категория | Количество файлов | Оценка экономии |
|-----------|-------------------|-----------------|
| .bak файлы | 1 | ~60KB |
| .js в src | ~200+ | ~2MB |
| .d.ts в src | ~200+ | ~500KB |
| .js.map в src | ~200+ | ~1MB |
| Дублирующие .snap | 2 | ~10KB |

**Итого:** потенциальная экономия ~3.5MB в репозитории
