# Руководство по использованию системы плагинов Ollama Code

## Содержание

1. [AutoStorage - Автоматическое хранилище](#autostorage---автоматическое-хранилище)
2. [Cross-Plugin Tool Execution](#cross-plugin-tool-execution)
3. [PluginServices - Сервисы плагинов](#pluginservices---сервисы-плагинов)
4. [Примеры использования](#примеры-использования)

---

## AutoStorage - Автоматическое хранилище

AutoStorage - это система автоматического сохранения данных, которая работает как "блокнот" для AI модели. Позволяет сохранять сгенерированный текст, веб-контент, уточнения пользователя и контекст беседы.

### Инициализация

```typescript
import { initializeAutoStorage } from '@ollama-code/core';

// Инициализация из экземпляра Storage
initializeAutoStorage(storage);
```

### Основные функции

#### 1. `autoSaveGeneratedText` - Сохранение сгенерированного текста

Вызывается когда AI генерирует текст, но не создаёт файл.

```typescript
import { autoSaveGeneratedText } from '@ollama-code/core';

const id = await autoSaveGeneratedText(
  'Сгенерированный код или текст...',
  {
    prompt: 'Напиши программу для сортировки массива',
    tags: ['code', 'generated', 'sorting'],
  }
);

console.log('Сохранено с ID:', id); // "1710422400000_abc123def"
```

**Параметры:**
- `content` (string) - Сгенерированный текст
- `metadata.prompt` (string, optional) - Исходный запрос
- `metadata.tags` (string[], optional) - Теги для категоризации

**Возвращает:** `string | null` - ID записи или null при ошибке

---

#### 2. `autoSaveWebContent` - Сохранение веб-контента

Вызывается при получении контента из интернета.

```typescript
import { autoSaveWebContent } from '@ollama-code/core';

const id = await autoSaveWebContent(
  'Содержимое статьи...',
  'https://example.com/article',
  {
    title: 'Заголовок статьи',
    tags: ['web', 'article', 'documentation'],
    ttl: 3600, // Время жизни в секундах (1 час)
  }
);
```

**Параметры:**
- `content` (string) - Содержимое страницы
- `sourceUrl` (string) - URL источника
- `metadata.title` (string, optional) - Заголовок
- `metadata.tags` (string[], optional) - Теги
- `metadata.ttl` (number, optional) - Время жизни записи в секундах

---

#### 3. `autoSaveUserClarification` - Сохранение уточнений пользователя

Вызывается когда пользователь отвечает на вопросы модели.

```typescript
import { autoSaveUserClarification } from '@ollama-code/core';

const id = await autoSaveUserClarification(
  'Какой язык программирования использовать?',
  'Python, пожалуйста',
  {
    tags: ['user-preference', 'language'],
  }
);

// Сохранённая запись: "Q: Какой язык программирования использовать?\nA: Python, пожалуйста"
```

**Параметры:**
- `question` (string) - Вопрос модели
- `answer` (string) - Ответ пользователя
- `metadata.tags` (string[], optional) - Теги

---

#### 4. `autoSaveConversationContext` - Сохранение контекста беседы

Вызывается при выявлении важного контекста в разговоре.

```typescript
import { autoSaveConversationContext } from '@ollama-code/core';

const id = await autoSaveConversationContext(
  'Пользователь предпочитает тёмную тему и TypeScript',
  {
    topic: 'user-preferences',
    importance: 'high', // 'high' | 'medium' | 'low'
    tags: ['preferences', 'ui', 'theme'],
  }
);
```

**Параметры:**
- `context` (string) - Контекстная информация
- `metadata.topic` (string, optional) - Тема
- `metadata.importance` ('high' | 'medium' | 'low', optional) - Важность
- `metadata.tags` (string[], optional) - Теги

---

#### 5. `getAutoSavedEntries` - Получение сохранённых записей

```typescript
import { getAutoSavedEntries, AutoStorageKeys } from '@ollama-code/core';

// Получить все сгенерированные тексты
const generatedTexts = await getAutoSavedEntries(AutoStorageKeys.GENERATED_TEXT);

// Получить весь веб-контент
const webContents = await getAutoSavedEntries(AutoStorageKeys.WEB_CONTENT);

// Получить уточнения пользователя
const clarifications = await getAutoSavedEntries(AutoStorageKeys.USER_CLARIFICATIONS);

// Получить контекст беседы
const context = await getAutoSavedEntries(AutoStorageKeys.CONVERSATION_CONTEXT);
```

**Доступные ключи:**
- `AutoStorageKeys.GENERATED_TEXT` - Сгенерированный текст
- `AutoStorageKeys.WEB_CONTENT` - Веб-контент
- `AutoStorageKeys.USER_CLARIFICATIONS` - Уточнения пользователя
- `AutoStorageKeys.CONVERSATION_CONTEXT` - Контекст беседы

---

#### 6. `clearAutoSavedEntries` - Очистка записей

```typescript
import { clearAutoSavedEntries, AutoStorageKeys } from '@ollama-code/core';

// Очистить все сгенерированные тексты
const success = await clearAutoSavedEntries(AutoStorageKeys.GENERATED_TEXT);
```

---

### Структура сохранённой записи

```typescript
interface AutoSavedEntry {
  id: string;           // Уникальный ID: "1710422400000_abc123def"
  timestamp: string;    // ISO timestamp: "2024-03-14T10:00:00.000Z"
  type: AutoStorageKey; // Тип записи
  content: string;      // Содержимое
  metadata?: {
    source?: string;    // URL для веб-контента, prompt для генерированного текста
    tags?: string[];    // Теги
    ttl?: number;       // Время жизни (секунды)
  };
}
```

### Где хранятся данные

Данные сохраняются в файловой системе:

```
.project-storage/
└── session/
    ├── generated_text.json
    ├── web_content.json
    ├── user_clarifications.json
    └── conversation_context.json
```

---

## Cross-Plugin Tool Execution

Cross-Plugin Tool Execution позволяет одному плагину вызывать инструменты другого плагина. Это ключевая возможность для создания сложных цепочек действий.

### Методы

#### 1. `executeTool` - Выполнение инструмента по имени

```typescript
// В контексте плагина (через PluginServices)
const result = await context.plugin.services.executeTool('write_file', {
  file_path: '/path/to/file.txt',
  content: 'Привет, мир!'
});

if (result.success) {
  console.log('Файл создан:', result.data);
} else {
  console.error('Ошибка:', result.error);
}
```

#### 2. `findTool` - Поиск инструмента по имени

```typescript
// Найти инструмент
const toolId = context.plugin.services.findTool('write_file');
if (toolId) {
  console.log('Инструмент найден:', toolId);
}
```

---

### Пример: Плагин, использующий другой инструмент

```typescript
import type { PluginDefinition, PluginTool, ToolExecutionContext } from '@ollama-code/core';

// Инструмент для создания отчёта
const reportGeneratorTool: PluginTool = {
  id: 'generate-report',
  name: 'generate_report',
  description: 'Генерирует отчёт и сохраняет в файл',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      data: { type: 'array' },
    },
    required: ['title', 'data'],
  },
  execute: async (params: { title: string; data: any[] }, context: ToolExecutionContext) => {
    // Генерируем содержимое отчёта
    const reportContent = `# ${params.title}\n\n` +
      params.data.map((item, i) => `${i + 1}. ${item}`).join('\n');
    
    // Используем write_file для сохранения
    const writeResult = await context.plugin.services.executeTool('write_file', {
      file_path: `/reports/${params.title.toLowerCase().replace(/\s+/g, '-')}.md`,
      content: reportContent,
    });
    
    if (!writeResult.success) {
      return {
        success: false,
        error: `Не удалось сохранить отчёт: ${writeResult.error}`,
      };
    }
    
    return {
      success: true,
      data: {
        message: 'Отчёт успешно создан',
        file: writeResult.data,
      },
    };
  },
};

// Определение плагина
const reportPlugin: PluginDefinition = {
  metadata: {
    id: 'report-generator',
    name: 'Report Generator',
    version: '1.0.0',
  },
  tools: [reportGeneratorTool],
};
```

---

## PluginServices - Сервисы плагинов

Каждый плагин имеет доступ к следующими сервисам через `context.plugin.services`:

### Доступные методы

```typescript
interface PluginServices {
  // === Регистрация инструментов ===
  
  /** Зарегистрировать новый инструмент */
  registerTool: (tool: PluginTool) => void;
  
  /** Удалить инструмент */
  unregisterTool: (toolId: string) => void;
  
  /** Получить все инструменты плагина */
  getTools: () => PluginTool[];
  
  // === Конфигурация ===
  
  /** Получить конфигурацию */
  getConfig: () => Record<string, unknown>;
  
  /** Установить конфигурацию */
  setConfig: (config: Record<string, unknown>) => void;
  
  // === Хранилище ===
  
  /** Получить экземпляр Storage */
  getStorage: () => Storage;
  
  /** Получить значение из хранилища */
  getStorageItem: (key: string) => unknown;
  
  /** Сохранить значение в хранилище */
  setStorageItem: (key: string, value: unknown) => void;
  
  // === Переменные окружения ===
  
  /** Получить переменную окружения */
  getEnv: (name: string, defaultValue?: string) => string | undefined;
  
  /** Получить все переменные окружения */
  getAllEnv: () => Record<string, string | undefined>;
  
  // === Промпты ===
  
  /** Получить реестр промптов */
  getPromptRegistry: () => PromptRegistry;
  
  // === Сессия ===
  
  /** Получить ID текущей сессии */
  getSessionId: () => string;
  
  /** Получить ID модели */
  getModelId: () => string | undefined;
  
  // === Cross-Plugin выполнение ===
  
  /** Выполнить инструмент по имени */
  executeTool: (toolName: string, params: Record<string, unknown>) => Promise<ToolExecutionResult>;
  
  /** Найти инструмент по имени */
  findTool: (toolName: string) => string | undefined;
  
  // === Уведомления ===
  
  /** Показать уведомление пользователю */
  showNotification: (notification: PluginNotification) => void;
  
  // === Команды ===
  
  /** Выполнить команду */
  executeCommand: (commandId: string, ...args: unknown[]) => Promise<unknown>;
}
```

---

## Примеры использования

### Пример 1: Создание плагина с авто-сохранением

```typescript
import type { PluginDefinition, PluginTool, ToolExecutionContext } from '@ollama-code/core';
import { autoSaveGeneratedText, autoSaveConversationContext } from '@ollama-code/core';

const aiAssistantTool: PluginTool = {
  id: 'ai-assist',
  name: 'ai_assist',
  description: 'AI помощник с автоматическим сохранением',
  parameters: {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
    },
    required: ['prompt'],
  },
  execute: async (params: { prompt: string }, context: ToolExecutionContext) => {
    // ... генерация ответа ...
    const generatedText = 'Ответ AI модели...';
    
    // Автоматически сохраняем сгенерированный текст
    await autoSaveGeneratedText(generatedText, {
      prompt: params.prompt,
      tags: ['ai-generated', 'assistant'],
    });
    
    // Сохраняем важный контекст
    await autoSaveConversationContext(
      `Пользователь спрашивал: ${params.prompt}`,
      { importance: 'medium', tags: ['user-query'] }
    );
    
    return {
      success: true,
      data: generatedText,
    };
  },
};

export const aiAssistantPlugin: PluginDefinition = {
  metadata: {
    id: 'ai-assistant',
    name: 'AI Assistant',
    version: '1.0.0',
  },
  tools: [aiAssistantTool],
};
```

### Пример 2: Комбинирование нескольких инструментов

```typescript
const dataProcessorTool: PluginTool = {
  id: 'process-data',
  name: 'process_data',
  description: 'Обрабатывает данные и сохраняет результат',
  parameters: {
    type: 'object',
    properties: {
      data: { type: 'array' },
      outputPath: { type: 'string' },
    },
    required: ['data'],
  },
  execute: async (params: { data: any[]; outputPath?: string }, context: ToolExecutionContext) => {
    // 1. Обработка данных
    const processedData = params.data.map(item => ({
      ...item,
      processed: true,
      timestamp: new Date().toISOString(),
    }));
    
    // 2. Если указан путь - сохраняем через write_file
    if (params.outputPath) {
      const writeResult = await context.plugin.services.executeTool('write_file', {
        file_path: params.outputPath,
        content: JSON.stringify(processedData, null, 2),
      });
      
      if (!writeResult.success) {
        return { success: false, error: writeResult.error };
      }
    }
    
    // 3. Автосохранение результата
    const { autoSaveGeneratedText } = await import('@ollama-code/core');
    await autoSaveGeneratedText(JSON.stringify(processedData), {
      tags: ['processed-data', 'json'],
    });
    
    return {
      success: true,
      data: {
        processed: processedData.length,
        items: processedData,
      },
    };
  },
};
```

### Пример 3: Получение сохранённых данных

```typescript
const historyViewerTool: PluginTool = {
  id: 'view-history',
  name: 'view_history',
  description: 'Просмотр истории сгенерированного контента',
  parameters: {
    type: 'object',
    properties: {
      type: { 
        type: 'string', 
        enum: ['generated_text', 'web_content', 'user_clarifications', 'conversation_context']
      },
      limit: { type: 'number' },
    },
  },
  execute: async (params: { type?: string; limit?: number }, context: ToolExecutionContext) => {
    const { getAutoSavedEntries, AutoStorageKeys } = await import('@ollama-code/core');
    
    // Определяем тип для получения
    const keyMap: Record<string, any> = {
      'generated_text': AutoStorageKeys.GENERATED_TEXT,
      'web_content': AutoStorageKeys.WEB_CONTENT,
      'user_clarifications': AutoStorageKeys.USER_CLARIFICATIONS,
      'conversation_context': AutoStorageKeys.CONVERSATION_CONTEXT,
    };
    
    const key = params.type ? keyMap[params.type] : AutoStorageKeys.GENERATED_TEXT;
    const entries = await getAutoSavedEntries(key);
    
    // Применяем лимит
    const limit = params.limit || 10;
    const limitedEntries = entries.slice(-limit);
    
    return {
      success: true,
      data: {
        total: entries.length,
        showing: limitedEntries.length,
        entries: limitedEntries,
      },
    };
  },
};
```

---

## Интеграция с Session

AutoStorage автоматически интегрируется с сессией через Session.ts:

```typescript
// В Session.ts при инициализации Config
import { initializeAutoStorage } from '../utils/autoStorage.js';

// При создании Config автоматически инициализируется AutoStorage
const config = await Config.create(workspaceDir);
// AutoStorage уже готов к использованию!
```

---

## Резюме

| Функция | Назначение | Возвращает |
|---------|------------|------------|
| `autoSaveGeneratedText` | Сохранить сгенерированный текст | `string \| null` (ID) |
| `autoSaveWebContent` | Сохранить веб-контент | `string \| null` (ID) |
| `autoSaveUserClarification` | Сохранить Q&A | `string \| null` (ID) |
| `autoSaveConversationContext` | Сохранить контекст | `string \| null` (ID) |
| `getAutoSavedEntries` | Получить записи | `AutoSavedEntry[]` |
| `clearAutoSavedEntries` | Очистить записи | `boolean` |
| `executeTool` | Выполнить инструмент | `ToolExecutionResult` |
| `findTool` | Найти инструмент | `string \| undefined` |
