#!/bin/bash
# Test: complex calculation with table output
# Expected: Model should:
# 1. Create TODO list with todo_write
# 2. Write Python program
# 3. Execute it
# 4. Output formatted table with results

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "Посчитай числа от 1 до 100, умножь каждое число кратное 3 на 3, и выведи топ-10 результатов в виде таблицы"
