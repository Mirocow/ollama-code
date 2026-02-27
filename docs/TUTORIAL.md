# Туториал: Начало работы с Ollama Code

## Введение

Ollama Code — это AI-ассистент для программирования, работающий с локальными моделями Ollama. Этот туториал поможет вам начать работу.

---

## Установка

### 1. Установка Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Или скачайте с https://ollama.com/download
```

### 2. Загрузка модели

```bash
# Рекомендуемая модель для кода
ollama pull qwen3-coder:30b

# Альтернативы
ollama pull llama3.2        # Общего назначения
ollama pull deepseek-r1:8b  # Thinking model
ollama pull codellama       # Для кода
```

### 3. Установка Ollama Code

```bash
# Клонирование репозитория
git clone https://github.com/your-repo/ollama-code.git
cd ollama-code

# Установка зависимостей
npm install

# Сборка
npm run build
```

---

## Первый запуск

### Запуск CLI

```bash
npm run start
```

Вы увидите приветственное сообщение:

```
╭─────────────────────────────────────────────╮
│                                             │
│  🦙 Ollama Code v0.10.5                    │
│                                             │
│  Model: qwen3-coder:30b                    │
│  Working Directory: /your/project          │
│                                             │
│  Type your message or /help for commands   │
│                                             │
╰─────────────────────────────────────────────╯
```

### Первое сообщение

Введите свой первый запрос:

```
> Привет! Помоги мне написать функцию для вычисления факториала
```

Ассистент ответит с кодом и объяснением.

---

## Основные команды

### Команды интерфейса

| Команда | Описание |
|---------|----------|
| `/help` | Справка по командам |
| `/clear` | Очистить историю |
| `/model` | Сменить модель |
| `/stats` | Статистика сессии |
| `/quit` | Выход |

### Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Enter` | Отправить сообщение |
| `Ctrl+C` | Отмена генерации |
| `Ctrl+D` | Выход |
| `↑/↓` | История сообщений |

---

## Практические примеры

### Пример 1: Анализ кода

```
> Проанализируй этот код и найди потенциальные проблемы:

```python
def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)
```

**Ответ ассистента:**
```
Found 2 issues:

1. **Division by zero**: If numbers is empty, len(numbers) = 0
   Fix: Add check for empty list

2. **Type safety**: No type hints
   Fix: Add type annotations

Suggested fix:
```python
from typing import List, Optional

def calculate_average(numbers: List[float]) -> Optional[float]:
    if not numbers:
        return None
    return sum(numbers) / len(numbers)
```
```

### Пример 2: Создание проекта

```
> Создай структуру простого REST API проекта на Express.js
```

Ассистент создаст файлы:
```
my-api/
├── src/
│   ├── index.js
│   ├── routes/
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   └── utils/
│       └── helpers.js
├── package.json
└── README.md
```

### Пример 3: Рефакторинг

```
> Отрефакторь этот код, используя современные практики:

```javascript
function getData(url) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.send();
  if (xhr.status === 200) {
    return JSON.parse(xhr.responseText);
  }
  return null;
}
```

**Результат:**
```typescript
async function getData<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}
```

### Пример 4: Git операции

```
> Сохрани текущие изменения в stash и переключись на ветку develop
```

### Пример 5: Тестирование API

```
> Протестируй endpoint https://jsonplaceholder.typicode.com/users
```

---

## Работа с файлами

### Чтение файла

```
> Прочитай файл package.json и объясни зависимости
```

### Редактирование

```
> Добавь JSDoc комментарии к функциям в utils.js
```

### Создание

```
> Создай файл .env.example с типичными переменными окружения
```

---

## Продвинутые возможности

### Thinking Mode (DeepSeek R1)

```
> Реши математическую задачу с объяснением рассуждений:
  Найди все корни уравнения x³ - 6x² + 11x - 6 = 0
```

Модель покажет процесс рассуждения:

```
<thinking>
Давай решим это уравнение методом разложения на множители.

Проверим x = 1: 1 - 6 + 11 - 6 = 0 ✓
Значит (x - 1) - множитель.

Разделим многочлен на (x - 1):
x³ - 6x² + 11x - 6 = (x - 1)(x² - 5x + 6)

Решим квадратное уравнение x² - 5x + 6 = 0:
D = 25 - 24 = 1
x = (5 ± 1) / 2
x = 3 или x = 2
</thinking>

Ответ: x = 1, x = 2, x = 3
```

### Structured Output

```
> Извлеки информацию из текста в формате JSON:
  "Иван Петров, 25 лет, работает разработчиком в Москве"

Формат: { name, age, job, city }
```

### Code Analysis

```
> Проанализируй файл src/index.ts на качество кода
```

Результат:
```
Score: 85/100 (Grade: B)

✓ Хорошие практики:
  - Типизация
  - Модульность

⚠ Рекомендации:
  - Снизить цикломатическую сложность в функции processOrder()
  - Добавить обработку ошибок
```

---

## Советы для эффективной работы

### 1. Формулируйте запросы чётко

❌ Плохо:
```
> Сделай код лучше
```

✅ Хорошо:
```
> Отрефактори функцию calculateTotal():
  - Добавь типы TypeScript
  - Обработай edge cases
  - Добавь документацию
```

### 2. Используйте контекст

```
> Дан файл utils.js (прочитан ранее):
  Добавь функцию debounce и экспортируй её
```

### 3. Разбивайте сложные задачи

```
> Задача: Создать систему аутентификации
  Шаг 1: Спроектируй структуру базы данных
  (жди моего подтверждения перед следующим шагом)
```

### 4. Просите объяснения

```
> Объясни почему ты выбрал именно это решение
```

---

## Решение проблем

### Ошибка подключения к Ollama

```bash
# Проверьте что Ollama запущен
ollama serve

# Проверьте доступность
curl http://localhost:11434/api/version
```

### Модель не найдена

```bash
# Загрузите модель
ollama pull llama3.2

# Проверьте список моделей
ollama list
```

### Медленная генерация

```bash
# Используйте меньшую модель
ollama pull llama3.2:1b

# Или модель с квантованием
ollama pull llama3.2:q4_0
```

### Проблемы с памятью

```typescript
// Уменьшите контекст
options: { num_ctx: 2048 }

// Или используйте меньшую модель
model: 'llama3.2:1b'
```

---

## Следующие шаги

1. **Изучите примеры**: [EXAMPLES.md](./EXAMPLES.md)
2. **API документация**: [OLLAMA_API.md](./OLLAMA_API.md)
3. **Структура проекта**: [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)

---

## Часто задаваемые вопросы

**Q: Какие модели поддерживаются?**
A: Любые модели Ollama: llama3.2, qwen3-coder, deepseek-r1, codellama, mistral и др.

**Q: Можно ли использовать без интернета?**
A: Да, всё работает локально после загрузки модели.

**Q: Как сменить модель?**
A: Используйте команду `/model` или переменную `OLLAMA_MODEL`.

**Q: Поддерживается ли Windows?**
A: Да, Ollama Code работает на Windows, macOS и Linux.

---

## Заключение

Теперь вы готовы использовать Ollama Code! Экспериментируйте, задавайте вопросы и создавайте отличный код.

**Полезные ссылки:**
- [Ollama](https://ollama.com)
- [GitHub Issues](https://github.com/your-repo/ollama-code/issues)
- [Документация](./)
