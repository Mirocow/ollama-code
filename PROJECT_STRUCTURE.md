# Структура проекта Ollama Code

## 📁 Корневые файлы

| Файл | Описание |
|------|----------|
| `package.json` | Конфигурация npm, скрипты сборки и запуска |
| `tsconfig.json` | Конфигурация TypeScript компилятора |
| `esbuild.config.js` | Конфигурация esbuild для бандлинга |
| `eslint.config.js` | Конфигурация ESLint линтера |
| `.prettierrc.json` | Конфигурация форматирования кода |
| `README.md` | Основная документация проекта |
| `CHANGELOG.md` | История изменений |
| `CONTRIBUTING.md` | Руководство для контрибьюторов |
| `SECURITY.md` | Политика безопасности |
| `REFACTORING_PLAN.md` | План рефакторинга проекта |
| `Dockerfile` | Docker-образ для контейнеризации |
| `Makefile` | Команды make для сборки |

---

## 📁 .vscode/ - Конфигурация VSCode

| Файл | Описание |
|------|----------|
| `launch.json` | Конфигурации отладки (Debug CLI, Tests, Attach) |
| `tasks.json` | Задачи VSCode (Build, Test, Lint, Start) |
| `settings.json` | Настройки редактора (formatting, excludes, ESLint) |
| `extensions.json` | Рекомендуемые расширения VSCode |

---

## 📁 docs/ - Документация

| Файл/Папка | Описание |
|------------|----------|
| `OLLAMA_API.md` | Документация Ollama REST API |
| `developers/` | Документация для разработчиков |
| `developers/architecture.md` | Архитектура проекта |
| `developers/roadmap.md` | Дорожная карта развития |
| `developers/tools/` | Документация инструментов (shell, grep, edit и др.) |
| `developers/sdk-typescript.md` | Документация SDK |
| `users/` | Документация для пользователей |
| `users/quickstart.md` | Быстрый старт |
| `users/configuration/` | Настройки (settings, auth, memory) |
| `users/features/` | Возможности (mcp, sandbox, skills) |

---

## 📁 scripts/ - Скрипты сборки

| Файл | Описание |
|------|----------|
| `start.js` | Точка входа для `npm run start` |
| `dev.js` | Режим разработки |
| `build.js` | Основной скрипт сборки |
| `build_package.js` | Сборка отдельного пакета |
| `clean.js` | Очистка артефактов сборки |
| `lint.js` | Запуск линтера |
| `test-ollama-api.sh` | Тестирование Ollama API |
| `sandbox_command.js` | Конфигурация песочницы |
| `pre-commit.js` | Хук pre-commit (lint-staged) |

---

## 📁 packages/core/ - Ядро

### Основные файлы
| Файл | Описание |
|------|----------|
| `src/index.ts` | Экспорт публичного API |
| `package.json` | Зависимости и скрипты core |

### 📁 src/core/ - Основная логика
| Файл | Описание |
|------|----------|
| `ollamaNativeClient.ts` | **Нативный клиент Ollama API** (chat, generate, models) |
| `ollamaNativeContentGenerator/` | Генератор контента через Ollama |
| `ollamaNativeContentGenerator/converter.ts` | Конвертер форматов Ollama ↔ Internal |
| `ollamaNativeContentGenerator/ollamaNativeContentGenerator.ts` | Основной генератор |
| `ollamaChat.ts` | Логика чата |
| `ollamaClient.ts` | Клиент для OpenAI-совместимого API |
| `prompts.ts` | Системные промпты |
| `logger.ts` | Логирование |
| `contentGenerator.ts` | Базовый генератор контента |
| `tokenLimits.ts` | Лимиты токенов моделей |
| `coreToolScheduler.ts` | Планировщик инструментов |
| `turn.ts` | Управление ходами диалога |
| `baseLlmClient.ts` | Базовый клиент LLM |

### 📁 src/tools/ - Инструменты
| Файл | Описание |
|------|----------|
| `tools.ts` | Регистрация всех инструментов |
| `tool-registry.ts` | Реестр инструментов |
| `read-file.ts` | Чтение файлов |
| `write-file.ts` | Запись файлов |
| `edit.ts` | Редактирование файлов (Edit, MultiEdit) |
| `ls.ts` | Листинг директорий |
| `glob.ts` | Поиск файлов по паттерну |
| `grep.ts` / `ripGrep.ts` | Поиск в файлах (ripgrep) |
| `shell.ts` | Выполнение shell команд |
| `web-fetch.ts` | Загрузка веб-страниц |
| `web-search/` | Веб-поиск (Tavily, Google) |
| `memoryTool.ts` | Долгосрочная память |
| `todoWrite.ts` | Управление TODO списком |
| `task.ts` | Субагенты (Task tool) |
| `mcp-tool.ts` | MCP инструменты |
| `mcp-client.ts` | MCP клиент |
| `mcp-client-manager.ts` | Менеджер MCP клиентов |
| `lsp.ts` | Language Server Protocol |
| `exitPlanMode.ts` | Выход из режима планирования |
| `skill.ts` | Загрузка skills |
| `diffOptions.ts` | Опции diff |
| `tool-error.ts` | Ошибки инструментов |
| `tool-names.ts` | Имена инструментов |

### 📁 src/utils/ - Утилиты
| Файл | Описание |
|------|----------|
| `errors.ts` | Базовые классы ошибок |
| `ollamaErrors.ts` | **Ошибки Ollama API** (новое) |
| `debugLogger.ts` | Логирование отладки в файл |
| `apiLogger.ts` | Логирование API запросов |
| `openaiLogger.ts` | Логирование OpenAI запросов |
| `fetch.ts` | HTTP клиент с retry |
| `retry.ts` | Логика повторных попыток |
| `rateLimit.ts` | Rate limiting |
| `safeJsonParse.ts` | Безопасный JSON парсинг |
| `safeJsonStringify.ts` | Безопасная сериализация JSON |
| `schemaValidator.ts` | Валидация JSON Schema |
| `schemaConverter.ts` | Конвертация схем |
| `fileUtils.ts` | Работа с файлами |
| `editor.ts` | Открытие в редакторе |
| `gitUtils.ts` | Git операции |
| `gitIgnoreParser.ts` | Парсинг .gitignore |
| `ollamaIgnoreParser.ts` | Парсинг .ollamaignore |
| `shell-utils.ts` | Утилиты для shell |
| `shellReadOnlyChecker.ts` | Проверка read-only команд |
| `terminalSerializer.ts` | Сериализация терминала |
| `textUtils.ts` | Текстовые утилиты |
| `formatters.ts` | Форматирование вывода |
| `paths.ts` | Работа с путями |
| `pathReader.ts` | Чтение путей |
| `configResolver.ts` | Разрешение конфигурации |
| `envVarResolver.ts` | Разрешение env переменных |
| `environmentContext.ts` | Контекст окружения |
| `workspaceContext.ts` | Контекст workspace |
| `promptIdContext.ts` | ID контекста промпта |
| `thoughtUtils.ts` | Утилиты для thinking |
| `nextSpeakerChecker.ts` | Определение следующего спикера |
| `readManyFiles.ts` | Чтение множества файлов |
| `getFolderStructure.ts` | Получение структуры папок |
| `projectSummary.ts` | Суммаризация проекта |
| `summarizer.ts` | Суммаризация контента |
| `memoryDiscovery.ts` | Обнаружение памяти |
| `memoryImportProcessor.ts` | Импорт памяти |
| `installationManager.ts` | Управление установкой |
| `subagentGenerator.ts` | Генерация субагентов |
| `browser.ts` | Браузерные утилиты |
| `secure-browser-launcher.ts` | Безопасный запуск браузера |
| `yaml-parser.ts` | Парсер YAML |
| `toml-to-markdown-converter.ts` | Конвертер TOML → Markdown |
| `jsonl-utils.ts` | Утилиты JSONL |
| `language-detection.ts` | Определение языка |
| `messageInspectors.ts` | Инспекция сообщений |
| `quotaErrorDetection.ts` | Детекция ошибок квоты |
| `errorParsing.ts` | Парсинг ошибок |
| `errorReporting.ts` | Отчёты об ошибках |
| `partUtils.ts` | Утилиты для частей контента |
| `ignorePatterns.ts` | Паттерны игнорирования |
| `ripgrepUtils.ts` | Утилиты ripgrep |
| `systemEncoding.ts` | Системная кодировка |
| `request-tokenizer/` | Токенизация запросов |
| `filesearch/` | Поиск файлов (crawler, cache) |
| `LruCache.ts` | LRU кэш |
| `testUtils.ts` | Утилиты для тестов |

### 📁 src/config/ - Конфигурация
| Файл | Описание |
|------|----------|
| `config.ts` | Основная конфигурация |
| `storage.ts` | Хранилище настроек |
| `constants.ts` | Константы |
| `models.ts` | Модели конфигурации |

### 📁 src/models/ - Модели
| Файл | Описание |
|------|----------|
| `modelRegistry.ts` | Реестр моделей |
| `modelConfigResolver.ts` | Разрешение конфигурации модели |
| `modelsConfig.ts` | Конфигурация моделей |
| `modelConfigErrors.ts` | Ошибки конфигурации |
| `constants.ts` | Константы моделей |
| `types.ts` | Типы моделей |

### 📁 src/types/ - Типы
| Файл | Описание |
|------|----------|
| `content.ts` | Типы контента (Content, Part, FunctionDeclaration) |
| `index.ts` | Экспорт типов |

### 📁 src/mcp/ - Model Context Protocol
| Файл | Описание |
|------|----------|
| `oauth-provider.ts` | OAuth провайдер |
| `oauth-utils.ts` | OAuth утилиты |
| `oauth-token-storage.ts` | Хранилище OAuth токенов |
| `google-auth-provider.ts` | Google аутентификация |
| `sa-impersonation-provider.ts` | Service Account impersonation |
| `token-storage/` | Хранилище токенов (file, keychain, hybrid) |
| `constants.ts` | Константы MCP |

### 📁 src/subagents/ - Субагенты
| Файл | Описание |
|------|----------|
| `subagent.ts` | Основной класс субагента |
| `subagent-manager.ts` | Менеджер субагентов |
| `subagent-events.ts` | События субагентов |
| `subagent-hooks.ts` | Хуки субагентов |
| `subagent-statistics.ts` | Статистика субагентов |
| `builtin-agents.ts` | Встроенные агенты |
| `validation.ts` | Валидация субагентов |
| `types.ts` | Типы субагентов |
| `index.ts` | Экспорт |

### 📁 src/services/ - Сервисы
| Файл | Описание |
|------|----------|
| `fileSystemService.ts` | Сервис файловой системы |
| `fileDiscoveryService.ts` | Обнаружение файлов |
| `gitService.ts` | Git сервис |
| `shellExecutionService.ts` | Выполнение shell |
| `chatRecordingService.ts` | Запись чата |
| `chatCompressionService.ts` | Сжатие чата |
| `sessionService.ts` | Сервис сессий |
| `loopDetectionService.ts` | Детекция циклов |

### 📁 src/extension/ - Расширения
| Файл | Описание |
|------|----------|
| `extensionManager.ts` | Менеджер расширений |
| `extensionSettings.ts` | Настройки расширений |
| `marketplace.ts` | Маркетплейс расширений |
| `github.ts` | GitHub интеграция |
| `settings.ts` | Настройки |
| `storage.ts` | Хранилище |
| `variables.ts` | Переменные |
| `override.ts` | Переопределения |
| `claude-converter.ts` | Конвертер Claude расширений |
| `gemini-converter.ts` | Конвертер Gemini расширений |
| `variableSchema.ts` | Схема переменных |
| `index.ts` | Экспорт |

### 📁 src/ide/ - IDE интеграция
| Файл | Описание |
|------|----------|
| `ide-client.ts` | Клиент IDE |
| `ide-installer.ts` | Установщик IDE |
| `ideContext.ts` | Контекст IDE |
| `detect-ide.ts` | Определение IDE |
| `process-utils.ts` | Утилиты процессов |
| `types.ts` | Типы IDE |
| `constants.ts` | Константы IDE |

### 📁 src/ide/ - Skills
| Файл | Описание |
|------|----------|
| `skill-manager.ts` | Менеджер skills |
| `skill-load.ts` | Загрузка skills |
| `types.ts` | Типы skills |
| `index.ts` | Экспорт |

### 📁 src/lsp/ - Language Server Protocol
| Файл | Описание |
|------|----------|
| `NativeLspService.ts` | LSP сервис |
| `NativeLspClient.ts` | LSP клиент |
| `LspServerManager.ts` | Менеджер LSP серверов |
| `LspConnectionFactory.ts` | Фабрика соединений |
| `LspConfigLoader.ts` | Загрузчик конфигурации |
| `LspLanguageDetector.ts` | Определение языка |
| `LspResponseNormalizer.ts` | Нормализация ответов |
| `types.ts` | Типы LSP |
| `constants.ts` | Константы LSP |

### 📁 src/telemetry/ - Телеметрия
| Файл | Описание |
|------|----------|
| `uiTelemetry.ts` | UI телеметрия |
| `types.ts` | Типы телеметрии |
| `index.ts` | Экспорт |

### 📁 src/prompts/ - Промпты
| Файл | Описание |
|------|----------|
| `prompt-registry.ts` | Реестр промптов |
| `mcp-prompts.ts` | MCP промпты |

### 📁 src/ollama-types/ - Типы Ollama
| Файл | Описание |
|------|----------|
| `index.ts` | Экспорт типов Ollama |

### 📁 src/output/ - Вывод
| Файл | Описание |
|------|----------|
| `json-formatter.ts` | JSON форматирование |
| `types.ts` | Типы вывода |

---

## 📁 packages/cli/ - CLI интерфейс

### Основные файлы
| Файл | Описание |
|------|----------|
| `index.ts` | Точка входа CLI |
| `package.json` | Зависимости и скрипты CLI |
| `docs/README.md` | Документация CLI |

### 📁 src/ui/ - UI компоненты (Ink/React)
| Файл | Описание |
|------|----------|
| `App.tsx` | Главный компонент приложения |
| `AppContainer.tsx` | Контейнер приложения |
| `colors.ts` | Цветовая схема |
| `semantic-colors.ts` | Семантические цвета |
| `constants.ts` | Константы UI |
| `types.ts` | Типы UI |
| `keyMatchers.ts` | Мэтчеры клавиш |

### 📁 src/ui/components/ - Компоненты UI
| Файл | Описание |
|------|----------|
| `Header.tsx` | Заголовок |
| `Footer.tsx` | Подвал |
| `InputPrompt.tsx` | Поле ввода |
| `Composer.tsx` | Компоновщик |
| `LoadingIndicator.tsx` | Индикатор загрузки |
| `Help.tsx` | Справка |
| `AboutBox.tsx` | Информация о приложении |
| `ModelDialog.tsx` | Диалог выбора модели |
| `ModelSwitchDialog.tsx` | Диалог переключения модели |
| `SettingsDialog.tsx` | Диалог настроек |
| `ThemeDialog.tsx` | Диалог темы |
| `ApprovalModeDialog.tsx` | Диалог режима подтверждения |
| `SessionPicker.tsx` | Выбор сессии |
| `TodoDisplay.tsx` | Отображение TODO |
| `ContextUsageDisplay.tsx` | Использование контекста |
| `MemoryUsageDisplay.tsx` | Использование памяти |
| `messages/` | Компоненты сообщений |
| `shared/` | Общие компоненты |
| `subagents/` | Компоненты субагентов |
| `views/` | Представления |

### 📁 src/ui/hooks/ - React хуки
| Файл | Описание |
|------|----------|
| `useOllamaStream.ts` | Потоковая обработка Ollama |
| `useInputHistory.ts` | История ввода |
| `useKeypress.ts` | Обработка клавиш |
| `useTerminalSize.ts` | Размер терминала |
| `useThemeCommand.ts` | Команда темы |
| `useModelCommand.ts` | Команда модели |
| `useSettingsCommand.ts` | Команда настроек |
| `useResumeCommand.ts` | Команда возобновления |
| `useApprovalModeCommand.ts` | Команда режима подтверждения |
| `useDialogClose.ts` | Закрытие диалога |
| `useFocus.ts` | Фокус |
| `useLoadingIndicator.ts` | Индикатор загрузки |
| `useMemoryMonitor.ts` | Мониторинг памяти |
| `useVisionAutoSwitch.ts` | Автопереключение VLM |
| `vim.ts` | Vim режим |

### 📁 src/ui/commands/ - Команды слеша
| Файл | Описание |
|------|----------|
| `helpCommand.ts` | /help |
| `clearCommand.ts` | /clear |
| `quitCommand.ts` | /quit |
| `modelCommand.ts` | /model |
| `themeCommand.ts` | /theme |
| `settingsCommand.ts` | /settings |
| `mcpCommand.ts` | /mcp |
| `memoryCommand.ts` | /memory |
| `resumeCommand.ts` | /resume |
| `exportCommand.ts` | /export |
| `statsCommand.ts` | /stats |
| `toolsCommand.ts` | /tools |
| `extensionsCommand.ts` | /extensions |
| `skillsCommand.ts` | /skills |
| `agentsCommand.ts` | /agents |
| `compressCommand.ts` | /compress |

### 📁 src/ui/themes/ - Темы
| Файл | Описание |
|------|----------|
| `theme.ts` | Базовая тема |
| `theme-manager.ts` | Менеджер тем |
| `default.ts` | Темная тема по умолчанию |
| `default-light.ts` | Светлая тема по умолчанию |
| `ollama-dark.ts` | Ollama темная |
| `ollama-light.ts` | Ollama светлая |
| `dracula.ts` | Dracula |
| `github-dark.ts` | GitHub Dark |
| `github-light.ts` | GitHub Light |
| `atom-one-dark.ts` | Atom One Dark |
| `ayu.ts` | Ayu Dark |
| `ayu-light.ts` | Ayu Light |
| `googlecode.ts` | Google Code |
| `xcode.ts` | Xcode |
| `shades-of-purple.ts` | Shades of Purple |
| `no-color.ts` | Без цветов |

### 📁 src/ui/contexts/ - React контексты
| Файл | Описание |
|------|----------|
| `AppContext.tsx` | Контекст приложения |
| `SessionContext.tsx` | Контекст сессии |
| `ConfigContext.tsx` | Контекст конфигурации |
| `SettingsContext.tsx` | Контекст настроек |
| `UIStateContext.tsx` | Состояние UI |
| `UIActionsContext.tsx` | Действия UI |
| `StreamingContext.tsx` | Контекст стриминга |
| `KeypressContext.tsx` | Контекст клавиш |
| `VimModeContext.tsx` | Контекст Vim режима |
| `ShellFocusContext.tsx` | Контекст фокуса shell |

### 📁 src/ui/utils/ - Утилиты UI
| Файл | Описание |
|------|----------|
| `highlight.ts` | Подсветка синтаксиса |
| `MarkdownDisplay.tsx` | Отображение Markdown |
| `InlineMarkdownRenderer.tsx` | Inline Markdown |
| `CodeColorizer.tsx` | Раскраска кода |
| `TableRenderer.tsx` | Рендеринг таблиц |
| `clipboardUtils.ts` | Работа с буфером обмена |
| `displayUtils.ts` | Утилиты отображения |
| `textUtils.ts` | Текстовые утилиты |
| `formatters.ts` | Форматирование |
| `terminalSetup.ts` | Настройка терминала |
| `export/` | Экспорт (HTML, JSON, Markdown) |

### 📁 src/config/ - Конфигурация CLI
| Файл | Описание |
|------|----------|
| `config.ts` | Конфигурация |
| `settings.ts` | Настройки |
| `settingsSchema.ts` | Схема настроек |
| `auth.ts` | Аутентификация |
| `keyBindings.ts` | Привязки клавиш |
| `trustedFolders.ts` | Доверенные папки |
| `sandboxConfig.ts` | Конфигурация песочницы |
| `webSearch.ts` | Веб-поиск |
| `modelProvidersScope.ts` | Область провайдеров моделей |

### 📁 src/commands/ - Команды CLI
| Файл | Описание |
|------|----------|
| `mcp.ts` | MCP команды (add, list, remove) |
| `extensions/` | Команды расширений |

### 📁 src/services/ - Сервисы CLI
| Файл | Описание |
|------|----------|
| `CommandService.ts` | Сервис команд |
| `BuiltinCommandLoader.ts` | Загрузчик встроенных команд |
| `FileCommandLoader.ts` | Загрузчик файловых команд |
| `McpPromptLoader.ts` | Загрузчик MCP промптов |
| `markdown-command-parser.ts` | Парсер markdown команд |
| `command-factory.ts` | Фабрика команд |
| `command-migration-tool.ts` | Инструмент миграции команд |
| `prompt-processors/` | Процессоры промптов |

### 📁 src/utils/ - Утилиты CLI
| Файл | Описание |
|------|----------|
| `errors.ts` | Ошибки |
| `checks.ts` | Проверки |
| `cleanup.ts` | Очистка |
| `gitUtils.ts` | Git утилиты |
| `sandbox.ts` | Песочница |
| `processUtils.ts` | Процессы |
| `relaunch.ts` | Перезапуск |
| `updateCheck.ts` | Проверка обновлений |
| `version.ts` | Версия |
| `windowTitle.ts` | Заголовок окна |

### 📁 src/acp-integration/ - ACP интеграция
| Файл | Описание |
|------|----------|
| `acp.ts` | ACP протокол |
| `acpAgent.ts` | ACP агент |
| `authMethods.ts` | Методы аутентификации |
| `errorCodes.ts` | Коды ошибок |
| `schema.ts` | Схема ACP |
| `session/` | Управление сессиями |
| `service/` | Сервисы |

### 📁 src/nonInteractive/ - Неинтерактивный режим
| Файл | Описание |
|------|----------|
| `session.ts` | Сессия |
| `io/` | Ввод/вывод (JSON, Stream) |
| `control/` | Управление |

### 📁 src/i18n/ - Интернационализация
| Файл | Описание |
|------|----------|
| `index.ts` | Экспорт |
| `languages.ts` | Языки |

---

## 📁 packages/sdk-typescript/ - SDK для TypeScript

| Файл | Описание |
|------|----------|
| `src/index.ts` | Точка входа SDK |
| `src/query/Query.ts` | Класс Query для запросов |
| `src/query/createQuery.ts` | Создание Query |
| `src/mcp/` | MCP для SDK |
| `src/transport/ProcessTransport.ts` | Транспорт процесса |
| `src/types/` | Типы SDK |
| `src/utils/Stream.ts` | Потоковая обработка |
| `src/utils/logger.ts` | Логирование |
| `src/utils/validation.ts` | Валидация |
| `README.md` | Документация SDK |

---

## 📁 packages/webui/ - Веб UI компоненты

| Файл | Описание |
|------|----------|
| `src/index.ts` | Экспорт компонентов |
| `src/components/ChatViewer/` | Просмотр чата |
| `src/components/layout/` | Компоненты layout |
| `src/adapters/` | Адаптеры (ACP, JSONL) |
| `src/context/` | Контексты React |
| `src/hooks/` | React хуки |
| `src/types/` | Типы |
| `src/styles/` | Стили |
| `vite.config.ts` | Конфигурация Vite |

---

## 📁 packages/test-utils/ - Утилиты для тестов

| Файл | Описание |
|------|----------|
| `index.ts` | Экспорт утилит |

---

## 📁 integration-tests/ - Интеграционные тесты

| Файл | Описание |
|------|----------|
| `test-helper.ts` | Хелперы для тестов |
| `test-mcp-server.ts` | Тестовый MCP сервер |
| `globalSetup.ts` | Глобальная настройка |
| `file-system.test.ts` | Тесты файловой системы |
| `edit.test.ts` | Тесты редактирования |
| `shell.test.ts` | Тесты shell |
| `web_search.test.ts` | Тесты веб-поиска |
| `memory.test.ts` | Тесты памяти |
| `todo_write.test.ts` | Тесты TODO |
| `task.test.ts` | Тесты субагентов |
| `mcp_server_cyclic_schema.test.ts` | Тесты MCP с циклическими схемами |
| `sdk-typescript/` | Тесты SDK |
| `terminal-bench/` | Benchmarks терминала |
| `terminal-capture/` | Захват терминала |
| `concurrent-runner/` | Параллельный запуск тестов |
| `vitest.config.ts` | Конфигурация Vitest |

---

## 📁 .qwen/skills/ - Skills

| Файл | Описание |
|------|----------|
| `pr-review/SKILL.md` | Skill для review PR |
| `terminal-capture/SKILL.md` | Skill для захвата терминала |

---

## 📁 coverage/ - Покрытие тестов

| Файл | Описание |
|------|----------|
| `coverage-final.json` | Финальный отчёт покрытия |
| `coverage-summary.json` | Сводка покрытия |
| `lcov-report/` | HTML отчёт lcov |

---

## 📁 logs/ - Логи

| Файл | Описание |
|------|----------|
| `ollama/api-*.json` | Логи API запросов к Ollama |

---

## Ключевые файлы для понимания проекта

1. **`packages/core/src/core/ollamaNativeClient.ts`** - Главный клиент для работы с Ollama API
2. **`packages/core/src/tools/tools.ts`** - Регистрация всех инструментов
3. **`packages/cli/src/ui/App.tsx`** - Главное приложение CLI
4. **`packages/cli/src/ui/hooks/useOllamaStream.ts`** - Потоковая обработка
5. **`.vscode/launch.json`** - Конфигурация отладки
