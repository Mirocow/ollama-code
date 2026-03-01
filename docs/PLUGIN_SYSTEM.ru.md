# Система плагинов

> Динамическая загрузка инструментов и регистрация во время выполнения

## Обзор

Система плагинов позволяет расширять Ollama Code с помощью пользовательских инструментов, загружаемых во время выполнения. Плагины могут определять новые инструменты, хуки и конфигурации без изменения основного кода.

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Архитектура плагинов                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Plugin Manager  │───▶│        Plugin Registry          │ │
│  └────────┬────────┘    │  - pluginA: { tools: [...] }    │ │
│           │             │  - pluginB: { tools: [...] }    │ │
│           ▼             └─────────────────────────────────┘ │
│  ┌─────────────────┐                                       │
│  │ Tool Registry   │◀── Инструменты объединены из плагинов │
│  └─────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Определение плагина

### Интерфейс

```typescript
interface PluginMetadata {
  /** Уникальный идентификатор плагина */
  id: string;
  
  /** Отображаемое имя */
  name: string;
  
  /** Версия плагина */
  version: string;
  
  /** Описание плагина */
  description?: string;
  
  /** Автор */
  author?: string;
  
  /** Требуемая версия Ollama Code */
  minimumVersion?: string;
  
  /** Зависимости от других плагинов */
  dependencies?: string[];
}

interface PluginDefinition {
  /** Метаданные плагина */
  metadata: PluginMetadata;
  
  /** Инструменты плагина */
  tools?: PluginTool[];
  
  /** Хуки жизненного цикла */
  hooks?: PluginHooks;
  
  /** Схема конфигурации */
  configSchema?: Record<string, ConfigSchema>;
  
  /** Конфигурация по умолчанию */
  defaultConfig?: Record<string, unknown>;
}

interface PluginTool {
  /** Уникальный идентификатор инструмента */
  id: string;
  
  /** Имя инструмента (что вызывает модель) */
  name: string;
  
  /** Описание инструмента */
  description: string;
  
  /** Схема параметров */
  parameters: JSONSchema;
  
  /** Обработчик */
  execute: (params: unknown, context: ToolContext) => Promise<ToolResult>;
  
  /** Требуется подтверждение? */
  requiresConfirmation?: boolean;
}

interface PluginHooks {
  /** Вызывается перед загрузкой плагина */
  beforeLoad?: () => Promise<void>;
  
  /** Вызывается после загрузки плагина */
  afterLoad?: () => Promise<void>;
  
  /** Вызывается перед выгрузкой плагина */
  beforeUnload?: () => Promise<void>;
  
  /** Вызывается перед выполнением инструмента */
  beforeToolExecute?: (toolName: string, params: unknown) => Promise<void>;
  
  /** Вызывается после выполнения инструмента */
  afterToolExecute?: (toolName: string, result: ToolResult) => Promise<void>;
}
```

## Создание плагина

### Базовый плагин

```typescript
// plugins/hello-world/index.ts
import { PluginDefinition, ToolResult } from 'ollama-code';

const helloWorldTool = {
  id: 'hello-world',
  name: 'hello_world',
  description: 'Приветствовать кого-то',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Имя для приветствия',
      },
    },
    required: ['name'],
  },
  execute: async (params: { name: string }): Promise<ToolResult> => {
    return {
      success: true,
      data: `Привет, ${params.name}!`,
    };
  },
};

export const helloWorldPlugin: PluginDefinition = {
  metadata: {
    id: 'hello-world',
    name: 'Hello World Plugin',
    version: '1.0.0',
    description: 'Простой пример плагина',
    author: 'Ваше Имя',
  },
  tools: [helloWorldTool],
};
```

### Плагин с хуками

```typescript
// plugins/database/index.ts
import { PluginDefinition, ToolResult, ToolContext } from 'ollama-code';

let dbConnection: DatabaseConnection | null = null;

const queryTool = {
  id: 'db-query',
  name: 'db_query',
  description: 'Выполнить запрос к базе данных',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'SQL запрос' },
      params: { type: 'array', items: { type: 'string' } },
    },
    required: ['query'],
  },
  requiresConfirmation: true,
  execute: async (
    params: { query: string; params?: string[] },
    context: ToolContext
  ): Promise<ToolResult> => {
    if (!dbConnection) {
      return { success: false, error: 'База данных не подключена' };
    }
    
    try {
      const result = await dbConnection.query(params.query, params.params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export const databasePlugin: PluginDefinition = {
  metadata: {
    id: 'database-plugin',
    name: 'Database Plugin',
    version: '1.0.0',
  },
  tools: [queryTool],
  hooks: {
    beforeLoad: async () => {
      console.log('Загрузка плагина базы данных...');
    },
    afterLoad: async () => {
      // Инициализация соединения
      dbConnection = await createConnection(config);
      console.log('База данных подключена');
    },
    beforeUnload: async () => {
      // Очистка
      if (dbConnection) {
        await dbConnection.close();
        dbConnection = null;
      }
    },
  },
  configSchema: {
    connectionString: {
      type: 'string',
      description: 'Строка подключения к базе данных',
      secret: true,
    },
    poolSize: {
      type: 'number',
      description: 'Размер пула соединений',
      default: 10,
    },
  },
  defaultConfig: {
    poolSize: 10,
  },
};
```

## API Plugin Manager

### Регистрация плагина

```typescript
import { pluginManager } from './plugins';

// Регистрация плагина
await pluginManager.registerPlugin(helloWorldPlugin);

// Регистрация с конфигурацией
await pluginManager.registerPlugin(databasePlugin, {
  connectionString: 'postgres://localhost/mydb',
  poolSize: 20,
});
```

### Включение/выключение плагина

```typescript
// Включить плагин
await pluginManager.enablePlugin('hello-world');

// Выключить плагин
await pluginManager.disablePlugin('hello-world');
```

### Проверка статуса плагина

```typescript
// Проверка загрузки плагина
const isLoaded = pluginManager.isPluginLoaded('hello-world');

// Проверка включения плагина
const isEnabled = pluginManager.isPluginEnabled('hello-world');

// Получение информации о плагине
const info = pluginManager.getPluginInfo('hello-world');
console.log(info.version); // '1.0.0'
```

### Список плагинов

```typescript
// Список всех зарегистрированных плагинов
const plugins = pluginManager.listPlugins();

plugins.forEach(plugin => {
  console.log(`${plugin.name} v${plugin.version} (${plugin.enabled ? 'включен' : 'выключен'})`);
});
```

### Удаление плагина

```typescript
// Полное удаление плагина
await pluginManager.unregisterPlugin('hello-world');
```

## Обнаружение плагинов

### Структура директорий

```
plugins/
├── hello-world/
│   ├── index.ts          # Точка входа плагина
│   ├── package.json      # Метаданные плагина
│   └── README.md         # Документация
├── database/
│   ├── index.ts
│   └── package.json
└── git-tools/
    ├── index.ts
    └── package.json
```

### Автообнаружение

```typescript
// Обнаружение плагинов из директории
await pluginManager.discoverPlugins('./plugins');

// Или из нескольких директорий
await pluginManager.discoverPlugins([
  './plugins',
  './node_modules/@my-org/ollama-code-plugins',
]);
```

### Плагин из NPM пакета

```json
// package.json
{
  "name": "@my-org/ollama-code-plugin-git",
  "version": "1.0.0",
  "main": "dist/index.js",
  "ollamaCodePlugin": {
    "id": "git-plugin",
    "name": "Git Plugin",
    "tools": ["git_status", "git_commit", "git_push"]
  }
}
```

## Конфигурация

### Файл конфигурации плагинов

```json
// ~/.ollama-code/plugins.json
{
  "plugins": {
    "hello-world": {
      "enabled": true
    },
    "database": {
      "enabled": true,
      "config": {
        "connectionString": "${DATABASE_URL}",
        "poolSize": 10
      }
    }
  }
}
```

### Переменные окружения

```typescript
// В определении плагина
configSchema: {
  apiKey: {
    type: 'string',
    description: 'API ключ',
    secret: true,
    env: 'MY_PLUGIN_API_KEY',  // Чтение из окружения
  },
}
```

### Конфигурация во время выполнения

```typescript
// Обновление конфигурации плагина
await pluginManager.updateConfig('database', {
  poolSize: 20,
});
```

## Поток выполнения инструмента

```
┌─────────────────────────────────────────────────────────────┐
│                 Поток выполнения инструмента                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Модель вызывает инструмент                               │
│     ↓                                                        │
│  2. CoreToolScheduler получает вызов                         │
│     ↓                                                        │
│  3. PluginManager.resolveTool(name)                          │
│     ↓                                                        │
│  4. Проверка необходимости подтверждения                     │
│     ↓                                                        │
│  5. Выполнение plugin.beforeToolExecute хука                 │
│     ↓                                                        │
│  6. tool.execute(params, context)                            │
│     ↓                                                        │
│  7. Выполнение plugin.afterToolExecute хука                  │
│     ↓                                                        │
│  8. Возврат результата модели                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Безопасность

### Песочница для плагинов

```typescript
// Плагины могут быть изолированы
const pluginManager = new PluginManager({
  sandbox: {
    enabled: true,
    permissions: {
      fs: ['read', 'write'],
      network: false,
      exec: false,
    },
  },
});
```

### Доверенные плагины

```typescript
// Пометить плагин как доверенный
pluginManager.setTrusted('hello-world', true);

// Загружать только доверенные плагины
pluginManager.loadTrustedOnly(true);
```

### Модель разрешений

```typescript
interface PluginPermissions {
  /** Доступ к файловой системе */
  fs?: ('read' | 'write' | 'delete')[];
  
  /** Сетевой доступ */
  network?: boolean;
  
  /** Выполнение shell команд */
  exec?: boolean;
  
  /** Доступ к секретам */
  secrets?: boolean;
  
  /** Управление другими плагинами */
  pluginManagement?: boolean;
}

// Определение в плагине
const myPlugin: PluginDefinition = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
  },
  permissions: {
    fs: ['read', 'write'],
    network: true,
  },
  tools: [...],
};
```

## Тестирование плагинов

### Unit тест

```typescript
import { describe, it, expect } from 'vitest';
import { helloWorldPlugin } from './index';

describe('Hello World Plugin', () => {
  it('should export correct metadata', () => {
    expect(helloWorldPlugin.metadata.id).toBe('hello-world');
    expect(helloWorldPlugin.metadata.version).toBe('1.0.0');
  });

  it('should have valid tools', () => {
    expect(helloWorldPlugin.tools).toHaveLength(1);
    expect(helloWorldPlugin.tools[0].name).toBe('hello_world');
  });

  it('should execute tool correctly', async () => {
    const tool = helloWorldPlugin.tools[0];
    const result = await tool.execute({ name: 'World' }, {});
    
    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello, World!');
  });
});
```

### Интеграционный тест

```typescript
import { PluginManager } from '../plugins';

describe('Plugin Manager Integration', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  afterEach(async () => {
    await manager.clear();
  });

  it('should register and enable plugin', async () => {
    await manager.registerPlugin(helloWorldPlugin);
    await manager.enablePlugin('hello-world');
    
    expect(manager.isPluginEnabled('hello-world')).toBe(true);
  });

  it('should resolve tool from plugin', async () => {
    await manager.registerPlugin(helloWorldPlugin);
    await manager.enablePlugin('hello-world');
    
    const tool = manager.resolveTool('hello_world');
    expect(tool).toBeDefined();
    expect(tool.name).toBe('hello_world');
  });
});
```

## Примеры плагинов

### Git плагин

```typescript
const gitStatusTool = {
  id: 'git-status',
  name: 'git_status',
  description: 'Получить статус репозитория',
  parameters: { type: 'object', properties: {} },
  execute: async (_, context) => {
    const result = await execGit('status --porcelain');
    return { success: true, data: result };
  },
};

const gitCommitTool = {
  id: 'git-commit',
  name: 'git_commit',
  description: 'Создать git коммит',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Сообщение коммита' },
    },
    required: ['message'],
  },
  requiresConfirmation: true,
  execute: async (params, context) => {
    await execGit(`commit -m "${params.message}"`);
    return { success: true, data: 'Коммит успешно создан' };
  },
};

export const gitPlugin: PluginDefinition = {
  metadata: {
    id: 'git-plugin',
    name: 'Git Tools',
    version: '1.0.0',
  },
  tools: [gitStatusTool, gitCommitTool],
};
```

## Связанная документация

- [Справочник инструментов](./TOOLS.ru.md)
- [Event Bus](./EVENT_BUS.md)
- [Участие в разработке](../CONTRIBUTING.md)

## Plugin Loader

### Динамическая загрузка плагинов

`PluginLoader` обрабатывает обнаружение и загрузку плагинов из нескольких источников:

```typescript
import { PluginLoader, createPluginLoader, pluginManager } from './plugins';

// Создание загрузчика
const loader = createPluginLoader(pluginManager, process.cwd());

// Обнаружение всех плагинов
const discovered = await loader.discoverPlugins();

// Загрузка всех валидных плагинов
const { loaded, failed } = await loader.loadAllPlugins(discovered);

console.log(`Загружено: ${loaded.join(', ')}`);
console.log(`Ошибки: ${failed.join(', ')}`);

// Включение всех загруженных плагинов
await loader.enableAllPlugins();
```

### Источники обнаружения плагинов

Загрузчик обнаруживает плагины из:

1. **Встроенные плагины**: `packages/core/src/plugins/builtin/*`
2. **Пользовательские плагины**: `~/.ollama-code/plugins/`
3. **Проектные плагины**: `.ollama-code/plugins/`
4. **npm пакеты**: `ollama-code-plugin-*` или `@scope/ollama-code-plugin-*`

### Манифест плагина (plugin.json)

```json
{
  "entry": "index.js",
  "metadata": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "Описание плагина",
    "author": "Имя автора",
    "tags": ["категория", "теги"],
    "enabledByDefault": true,
    "dependencies": [
      { "pluginId": "other-plugin", "optional": false }
    ]
  }
}
```

## Встроенные плагины

Ollama Code включает несколько встроенных плагинов, предоставляющих базовую функциональность:

### Core Tools Plugin

Расположен в `packages/core/src/plugins/builtin/core-tools/`:

- **echo**: Эхо сообщений (тестирование)
- **timestamp**: Получение текущей временной метки в различных форматах
- **get_env**: Получение значений переменных окружения (с маскировкой безопасности)

### File Tools Plugin

Расположен в `packages/core/src/plugins/builtin/file-tools/`:

| Инструмент     | Категория | Описание                            |
| -------------- | --------- | ----------------------------------- |
| `read_file`    | read      | Чтение файлов с пагинацией          |
| `write_file`   | edit      | Создание или перезапись файлов      |
| `edit`         | edit      | Замена содержимого в существующих файлах |
| `glob`         | search    | Поиск файлов по шаблону             |
| `list_directory`| read     | Листинг содержимого директорий      |

### Shell Tools Plugin

Расположен в `packages/core/src/plugins/builtin/shell-tools/`:

| Инструмент          | Категория | Описание                              |
| ------------------- | --------- | ------------------------------------- |
| `run_shell_command` | execute   | Выполнение shell команд с таймаутом   |
| `bash`              | execute   | Упрощённое выполнение bash команд     |

### Search Tools Plugin

Расположен в `packages/core/src/plugins/builtin/search-tools/`:

| Инструмент  | Категория | Описание                    |
| ----------- | --------- | --------------------------- |
| `grep_search`| search   | Поиск в файлах по regex     |
| `glob`      | search    | Поиск файлов по glob шаблону|
| `web_fetch` | fetch     | Получение контента с URL    |
| `web_search`| fetch     | Поиск в интернете           |

### Development Tools Plugin

Расположен в `packages/core/src/plugins/builtin/dev-tools/`:

| Инструмент      | Языки     | Описание                        |
| --------------- | --------- | ------------------------------- |
| `python_dev`    | Python    | pip, pytest, flake8, Django     |
| `nodejs_dev`    | Node.js   | npm, yarn, pnpm, Next.js        |
| `golang_dev`    | Go        | go build, test, mod, fmt        |
| `rust_dev`      | Rust      | cargo build, test, clippy       |
| `typescript_dev`| TypeScript| tsc, ts-node                    |
| `java_dev`      | Java      | Maven, Gradle, javac            |
| `cpp_dev`       | C/C++     | gcc, g++, cmake, make           |
| `swift_dev`     | Swift     | swift build, test, package      |
| `php_dev`       | PHP       | php, composer, artisan          |

## Plugin Marketplace

Ollama Code включает Plugin Marketplace для поиска, установки и управления плагинами из npm-реестра.

### Быстрый старт

```bash
# Поиск плагинов
plugin search git

# Установка плагина
plugin install ollama-code-plugin-git-tools

# Обновление всех плагинов
plugin update --all

# Список установленных плагинов
plugin list
```

### Programmatic API

```typescript
import { createPluginMarketplace } from '@ollama-code/ollama-code-core';

const marketplace = createPluginMarketplace(process.cwd());

// Поиск плагинов
const plugins = await marketplace.search({ query: 'git' });

// Установка плагина
const result = await marketplace.install('my-plugin', {
  global: true,
  version: '1.0.0',
});

// Обновление всех плагинов
const updates = await marketplace.updateAll({ checkOnly: true });
```

### Уровни доверия

| Уровень      | Описание                                         |
| ------------ | ------------------------------------------------ |
| `verified`   | Официально верифицированные плагины              |
| `community`  | Плагины от сообщества с хорошей репутацией       |
| `unverified` | Непроверенные плагины (требуют `--skip-verification`) |

**Полная документация**: См. [Plugin Marketplace](./PLUGIN_MARKETPLACE.md) для детального описания CLI команд, API и создания плагинов.
