# Example 2: Table Generation with Calculations

## Command

```bash
export OLLAMA_HOST="178.140.10.58:61434"
export OLLAMA_BASE_URL="http://178.140.10.58:61434"

pnpm run cli -- \
  --model "krith/qwen2.5-coder-14b-instruct:IQ4_XS" \
  --yolo \
  --prompt "Посчитай мне от 1-100 затем умножь каждое число на его порядковый номер. Составь таблицу со значениями самых больших чисел. Отсортируй в порядке убывания и выведи 10 строк."
```

## Expected Behavior

Model MUST:
1. Create TODO list using `todo_write` tool
2. Write a program (choose best language: Python/Node.js/Go)
3. Run the program
4. Output formatted table

## Expected Output

```markdown
| Порядковый номер | Значение |
|------------------|----------|
| 1                | 10000    |
| 2                | 9801     |
| 3                | 9604     |
| 4                | 9409     |
| 5                | 9216     |
| 6                | 9025     |
| 7                | 8836     |
| 8                | 8649     |
| 9                | 8464     |
| 10               | 8281     |
```

## Why Python is Best for This Task

- Data processing with list comprehensions
- Easy sorting with `sorted(..., reverse=True)`
- Simple iteration and formatting
