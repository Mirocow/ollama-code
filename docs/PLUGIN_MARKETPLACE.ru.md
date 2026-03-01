# Plugin Marketplace

> Поиск, установка и управление плагинами из реестра npm

## Обзор

Plugin Marketplace — это система для поиска, установки, обновления и управления плагинами Ollama Code через npm-реестр. Marketplace позволяет расширять функциональность Ollama Code без изменения исходного кода.

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    Архитектура Marketplace                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │    CLI Layer    │────▶│      PluginMarketplace          │   │
│  │  plugin search  │     │  - search()                     │   │
│  │  plugin install │     │  - install()                    │   │
│  │  plugin update  │     │  - update()                     │   │
│  └─────────────────┘     │  - uninstall()                  │   │
│                          └────────────┬────────────────────┘   │
│                                       │                         │
│                          ┌────────────▼────────────────────┐   │
│                          │         npm Registry            │   │
│                          │  - registry.npmjs.org           │   │
│                          │  - ollama-code-plugin-*         │   │
│                          └─────────────────────────────────┘   │
│                                                                  │
│  Директории установки:                                          │
│  ├─ Пользовательские: ~/.ollama-code/plugins/                   │
│  └─ Проектные: .ollama-code/plugins/                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Интерфейс командной строки (CLI)

### Поиск плагинов

```bash
# Базовый поиск
plugin search <query>

# Поиск с фильтрами
plugin search "git" --limit 10 --sort-by downloads

# Поиск только непроверенных плагинов
plugin search "database" --trust-level unverified
```

**Опции поиска:**

| Опция | Описание | По умолчанию |
|-------|----------|--------------|
| `--limit` | Максимальное количество результатов | 20 |
| `--sort-by` | Сортировка: `downloads`, `stars`, `updated`, `name` | `downloads` |
| `--sort-order` | Порядок: `asc`, `desc` | `desc` |
| `--trust-level` | Фильтр по уровню доверия | все |
| `--author` | Фильтр по автору | - |
| `--keywords` | Фильтр по ключевым словам | - |

### Информация о плагине

```bash
# Получить детальную информацию о плагине
plugin info <plugin-id>

# Пример
plugin info git-tools
```

**Вывод включает:**
- Название и версия плагина
- Описание и ключевые слова
- Автор и лицензия
- Количество загрузок
- Статус установки
- URL репозитория и домашней страницы

### Установка плагина

```bash
# Базовая установка (глобально)
plugin install <plugin-id>

# Установка конкретной версии
plugin install my-plugin --version 1.2.0

# Установка в проект (локально)
plugin install my-plugin --no-global

# Принудительная переустановка
plugin install my-plugin --force

# Пропуск верификации (для непроверенных плагинов)
plugin install experimental-plugin --skip-verification

# Тестовый запуск (без реальной установки)
plugin install my-plugin --dry-run
```

**Опции установки:**

| Опция | Описание | По умолчанию |
|-------|----------|--------------|
| `--version` | Конкретная версия | `latest` |
| `--global` | Глобальная установка (user-level) | `true` |
| `--force` | Переустановка при наличии | `false` |
| `--skip-verification` | Пропуск проверки безопасности | `false` |
| `--dry-run` | Тестовый запуск | `false` |

### Обновление плагина

```bash
# Обновить конкретный плагин
plugin update <plugin-id>

# Обновить все установленные плагины
plugin update --all

# Только проверить наличие обновлений
plugin update --check-only

# Тестовый запуск обновления
plugin update --dry-run
```

### Удаление плагина

```bash
# Удалить плагин
plugin uninstall <plugin-id>

# Удалить локально установленный плагин
plugin uninstall my-plugin --no-global
```

### Список установленных плагинов

```bash
# Показать все установленные плагины
plugin list
```

## Programmatic API

### Создание экземпляра Marketplace

```typescript
import { createPluginMarketplace, PluginMarketplace } from '@ollama-code/ollama-code-core';

// Создать экземпляр с текущей директорией проекта
const marketplace = createPluginMarketplace(process.cwd());

// Или напрямую через класс
const marketplace = new PluginMarketplace('/path/to/project');
```

### Поиск плагинов

```typescript
import type { MarketplaceSearchOptions } from '@ollama-code/ollama-code-core';

const options: MarketplaceSearchOptions = {
  query: 'git',
  keywords: ['version-control'],
  sortBy: 'downloads',
  sortOrder: 'desc',
  limit: 10,
  includeInstalled: true,
};

const plugins = await marketplace.search(options);

for (const plugin of plugins) {
  console.log(`${plugin.name} v${plugin.version}`);
  console.log(`  Установлен: ${plugin.installed}`);
  console.log(`  Уровень доверия: ${plugin.trustLevel}`);
}
```

### Получение информации о плагине

```typescript
// Получить плагин по ID или имени пакета
const plugin = await marketplace.getPlugin('git-tools');

if (plugin) {
  console.log(`Имя: ${plugin.name}`);
  console.log(`Описание: ${plugin.description}`);
  console.log(`Автор: ${plugin.author?.name}`);
  console.log(`Репозиторий: ${plugin.repository}`);
  console.log(`Верифицирован: ${plugin.verified}`);
}
```

### Установка плагина

```typescript
import type { PluginInstallOptions } from '@ollama-code/ollama-code-core';

const options: PluginInstallOptions = {
  version: '1.2.0',       // Опционально: конкретная версия
  global: true,           // Глобальная установка
  force: false,           // Не переустанавливать
  skipVerification: false, // Проверять безопасность
  dryRun: false,          // Реальная установка
};

const result = await marketplace.install('my-plugin', options);

if (result.success) {
  console.log(result.message);
  console.log(`Установлен в: ${result.plugin?.installedPath}`);
} else {
  console.error(`Ошибка: ${result.message}`);
}
```

### Обновление плагина

```typescript
import type { PluginUpdateOptions } from '@ollama-code/ollama-code-core';

// Обновить конкретный плагин
const result = await marketplace.update('my-plugin', {
  checkOnly: true,  // Только проверить
});

// Обновить все плагины
const results = await marketplace.updateAll({
  checkOnly: false,
  dryRun: false,
});

for (const result of results) {
  console.log(`${result.pluginId}: ${result.message}`);
}
```

### Удаление плагина

```typescript
const result = await marketplace.uninstall('my-plugin', {
  global: true,
});

if (result.success) {
  console.log('Плагин успешно удалён');
}
```

### Получение списка установленных плагинов

```typescript
const installed = await marketplace.getInstalledPlugins();

for (const plugin of installed) {
  console.log(`${plugin.name} v${plugin.installedVersion}`);
  console.log(`  Путь: ${plugin.installedPath}`);
  console.log(`  Доступно обновление: ${plugin.updateAvailable}`);
}
```

## Типы данных

### MarketplacePlugin

```typescript
interface MarketplacePlugin {
  /** Уникальный ID плагина */
  id: string;
  
  /** Имя пакета на npm */
  packageName: string;
  
  /** Отображаемое имя */
  name: string;
  
  /** Описание плагина */
  description: string;
  
  /** Версия */
  version: string;
  
  /** Информация об авторе */
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  
  /** Ключевые слова для поиска */
  keywords: string[];
  
  /** Количество загрузок */
  downloads?: number;
  
  /** GitHub звёзды */
  stars?: number;
  
  /** Лицензия */
  license?: string;
  
  /** URL репозитория */
  repository?: string;
  
  /** URL домашней страницы */
  homepage?: string;
  
  /** Путь установки */
  installedPath?: string;
  
  /** Установлен ли плагин */
  installed: boolean;
  
  /** Установленная версия */
  installedVersion?: string;
  
  /** Доступно ли обновление */
  updateAvailable: boolean;
  
  /** Манифест плагина (если установлен) */
  manifest?: PluginManifest;
  
  /** Уровень доверия */
  trustLevel: 'verified' | 'community' | 'unverified';
  
  /** Верифицирован ли плагин */
  verified: boolean;
  
  /** Дата последнего обновления */
  updatedAt?: string;
  
  /** Дата создания */
  createdAt?: string;
}
```

### MarketplaceSearchOptions

```typescript
interface MarketplaceSearchOptions {
  /** Поисковый запрос */
  query?: string;
  
  /** Фильтр по ключевым словам */
  keywords?: string[];
  
  /** Фильтр по автору */
  author?: string;
  
  /** Фильтр по уровню доверия */
  trustLevel?: ('verified' | 'community' | 'unverified')[];
  
  /** Сортировка */
  sortBy?: 'downloads' | 'stars' | 'updated' | 'name';
  
  /** Порядок сортировки */
  sortOrder?: 'asc' | 'desc';
  
  /** Максимум результатов */
  limit?: number;
  
  /** Включить установленные плагины */
  includeInstalled?: boolean;
}
```

### PluginInstallOptions

```typescript
interface PluginInstallOptions {
  /** Конкретная версия для установки */
  version?: string;
  
  /** Глобальная установка (user-level) */
  global?: boolean;
  
  /** Принудительная переустановка */
  force?: boolean;
  
  /** Пропуск верификации */
  skipVerification?: boolean;
  
  /** Тестовый запуск */
  dryRun?: boolean;
}
```

### PluginUpdateOptions

```typescript
interface PluginUpdateOptions {
  /** Обновить до конкретной версии */
  version?: string;
  
  /** Обновить все плагины */
  all?: boolean;
  
  /** Только проверить обновления */
  checkOnly?: boolean;
  
  /** Тестовый запуск */
  dryRun?: boolean;
}
```

## Уровни доверия (Trust Levels)

### verified

Плагины, прошедшие официальную верификацию командой Ollama Code:
- Прошли проверку безопасности кода
- Имеют активное обслуживание
- Соответствуют стандартам качества

### community

Плагины от сообщества с хорошей репутацией:
- Опубликованы известными авторами
- Имеют положительные отзывы
- Регулярно обновляются

### unverified

Непроверенные плагины:
- Новые плагины без истории
- Требуют флага `--skip-verification` для установки
- Рекомендуется проверять код перед использованием

## Директории установки

### Глобальная установка (по умолчанию)

```
~/.ollama-code/plugins/
├── node_modules/
│   └── ollama-code-plugin-my-plugin/
│       ├── package.json
│       ├── plugin.json
│       └── index.js
└── package.json
```

### Локальная установка (проект)

```
.ollama-code/plugins/
├── node_modules/
│   └── ollama-code-plugin-my-plugin/
│       ├── package.json
│       ├── plugin.json
│       └── index.js
└── package.json
```

## Создание плагина для Marketplace

### Структура пакета npm

```
ollama-code-plugin-my-plugin/
├── package.json        # Метаданные пакета npm
├── plugin.json         # Манифест плагина Ollama Code
├── index.js            # Точка входа
├── README.md           # Документация
└── LICENSE             # Лицензия
```

### package.json

```json
{
  "name": "ollama-code-plugin-my-plugin",
  "version": "1.0.0",
  "description": "Мой замечательный плагин Ollama Code",
  "main": "index.js",
  "keywords": [
    "ollama-code-plugin",
    "ollama-code",
    "ai",
    "tools"
  ],
  "author": {
    "name": "Ваше Имя",
    "email": "you@example.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/user/ollama-code-plugin-my-plugin"
  },
  "homepage": "https://github.com/user/ollama-code-plugin-my-plugin#readme",
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@ollama-code/ollama-code-core": ">=4.0.0"
  }
}
```

### plugin.json

```json
{
  "entry": "index.js",
  "metadata": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "Предоставляет пользовательские инструменты для моего рабочего процесса",
    "author": "Ваше Имя",
    "tags": ["productivity", "automation"],
    "enabledByDefault": false
  }
}
```

### index.js

```javascript
/**
 * @type {import('@ollama-code/ollama-code-core').PluginDefinition}
 */
module.exports = {
  metadata: {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'Предоставляет пользовательские инструменты для моего рабочего процесса',
  },
  
  tools: [
    {
      id: 'my-tool',
      name: 'my_custom_tool',
      description: 'Выполняет пользовательскую операцию',
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Входные данные для обработки',
          },
        },
        required: ['input'],
      },
      category: 'other',
      execute: async (params, context) => {
        context.logger.info('Выполнение пользовательского инструмента');
        
        return {
          success: true,
          data: `Обработано: ${params.input}`,
          display: {
            title: 'Результат пользовательского инструмента',
            summary: `Успешно обработаны входные данные`,
          },
        };
      },
    },
  ],
  
  hooks: {
    onLoad: async (context) => {
      context.logger.info('Мой плагин загружен!');
    },
  },
};
```

### Публикация в npm

```bash
# Авторизоваться в npm
npm login

# Опубликовать пакет
npm publish

# Опубликовать scoped пакет (для организаций)
npm publish --access public
```

### Требования к публикации

1. **Имя пакета**: Должно начинаться с `ollama-code-plugin-` или быть scoped `@scope/ollama-code-plugin-*`
2. **Ключевые слова**: Обязательно включите `ollama-code-plugin`
3. **Лицензия**: Рекомендуется OSI-совместимая лицензия
4. **README.md**: Документация по использованию плагина

## CLI индикаторы статуса

При отображении плагинов используются следующие индикаторы:

| Индикатор | Значение |
|-----------|----------|
| 📦 | Плагин доступен для установки |
| 📦✓ | Плагин установлен (актуальная версия) |
| 📦⬆️ | Плагин установлен, доступно обновление |
| ✓ | Верифицированный плагин |
| ○ | Плагин от сообщества |
| ? | Непроверенный плагин |

## Связанная документация

- [Система плагинов](./PLUGIN_SYSTEM.ru.md) — Общая документация по системе плагинов
- [Песочница плагинов](./PLUGIN_SANDBOX.md) — Безопасное выполнение плагинов
- [Справочник инструментов](./TOOLS.ru.md) — Справочник по инструментам
