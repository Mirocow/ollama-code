#!/bin/bash
# Test: calculate sum from 1 to 100
# Expected: Model should:
# 1. Create TODO list with todo_write
# 2. Write Python program
# 3. Execute it
# 4. Output result (5050)

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "Посчитай сумму от 1 до 100 и выведи результат"
