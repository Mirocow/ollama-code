#!/bin/bash
# Test: generate a table
# Expected: Model should:
# 1. Create TODO list with todo_write
# 2. Write Python program
# 3. Execute it
# 4. Output formatted table

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "Создай таблицу квадратов чисел от 1 до 10"
