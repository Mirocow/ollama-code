# Ollama Code - Roadmap развития

## Версия 0.11.0 (Текущая разработка)

### 1. Новые Ollama API Endpoints

#### 1.1 Create Model (POST /api/create)
```typescript
// Создание модели из Modelfile
await client.createModel({
  name: 'my-custom-model',
  modelfile: 'FROM llama3.2\nSYSTEM You are a coding assistant.',
  stream: true
}, (progress) => {
  console.log(progress.status);
});
```

#### 1.2 Thinking Models Support (DeepSeek R1, Qwen)
```typescript
// Поддержка thinking моделей
await client.chat({
  model: 'deepseek-r1:8b',
  messages: [{ role: 'user', content: 'Solve this problem' }],
  think: true, // Включить thinking mode
});
```

#### 1.3 Structured Outputs (JSON Schema)
```typescript
// Структурированный вывод с JSON Schema
await client.generate({
  model: 'llama3.2',
  prompt: 'Extract person info',
  format: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      email: { type: 'string' }
    },
    required: ['name', 'age']
  }
});
```

#### 1.4 Image Generation (Experimental)
```typescript
// Генерация изображений
await client.generateImage({
  model: 'stable-diffusion',
  prompt: 'A beautiful sunset over mountains',
  width: 512,
  height: 512,
  steps: 30
});
```

---

### 2. Новые инструменты

#### 2.1 Code Analyzer Tool
```typescript
// Анализ кода
{
  name: 'code_analyzer',
  description: 'Analyze code for complexity, patterns, and issues',
  parameters: {
    file: 'path/to/file.ts',
    analysis: ['complexity', 'security', 'performance', 'style']
  }
}
```

#### 2.2 Diagram Generator Tool
```typescript
// Генерация диаграмм
{
  name: 'diagram_generator',
  description: 'Generate diagrams from code or descriptions',
  parameters: {
    type: 'mermaid' | 'plantuml',
    content: 'classDiagram\n  Animal <|-- Dog',
    output: 'path/to/diagram.svg'
  }
}
```

#### 2.3 Git Advanced Tool
```typescript
// Продвинутые git операции
{
  name: 'git_advanced',
  description: 'Advanced git operations',
  operations: ['stash', 'cherry-pick', 'rebase', 'bisect', 'blame']
}
```

#### 2.4 API Tester Tool
```typescript
// Тестирование API
{
  name: 'api_tester',
  description: 'Test REST API endpoints',
  parameters: {
    url: 'http://api.example.com/endpoint',
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: {},
    body: {},
    validateResponse: {}
  }
}
```

---

### 3. UI/UX Улучшения

#### 3.1 Прогресс-бары
- Прогресс загрузки моделей
- Прогресс генерации
- Прогресс выполнения инструментов

#### 3.2 Улучшенные индикаторы
- Thinking indicator для thinking моделей
- Token usage display
- Memory usage in real-time
- GPU usage indicator

#### 3.3 Новые темы
- Tokyo Night
- Nord
- Gruvbox
- Catppuccin

#### 3.4 Анимации
- Плавные переходы
- Typewriter effect для ответов
- Particle effects для thinking

---

## Версия 0.12.0 (Планируется)

### 4. MCP Protocol Extensions

#### 4.1 Resource Support
- Чтение/запись ресурсов через MCP
- Мониторинг изменений

#### 4.2 Prompts Registry
- Шаблоны промптов
- Пользовательские промпты

---

### 5. Performance Improvements

#### 5.1 Streaming Optimizations
- Chunked transfer encoding
- Compression support

#### 5.2 Caching Layer
- Response caching
- Embedding caching
- Model metadata caching

---

## Приоритеты реализации

| Задача | Приоритет | Сложность | Версия |
|--------|-----------|-----------|--------|
| Create Model API | High | Medium | 0.11.0 |
| Thinking Models | High | Low | 0.11.0 |
| Structured Outputs | High | Medium | 0.11.0 |
| Code Analyzer Tool | Medium | High | 0.11.0 |
| Progress Bars | High | Low | 0.11.0 |
| New Themes | Medium | Low | 0.11.0 |
| Image Generation | Low | High | 0.12.0 |
| Diagram Generator | Medium | Medium | 0.12.0 |
| Git Advanced | Medium | Medium | 0.12.0 |
| API Tester | Low | Medium | 0.12.0 |
