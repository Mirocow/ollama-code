#!/bin/bash
# Test: Computational task with table output
# Expected: Model should:
# 1. Create TODO list with todo_write
# 2. Write Python program
# 3. Execute and output formatted table

PROMPT="Создай таблицу квадратов и кубов чисел от 1 до 10. Выведи в формате: Число | Квадрат | Куб"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
