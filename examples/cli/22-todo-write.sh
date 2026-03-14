#!/bin/bash
# Test: todo_write tool
# Expected: Model should create a todo list

PROMPT="Создай список задач для разработки простого REST API: планирование, реализация, тестирование"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
