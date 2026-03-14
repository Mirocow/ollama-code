#!/bin/bash
# Test: core tools (echo, timestamp, get_env)
# Expected: Model should use core tools

PROMPT="Используя инструмент echo выведи 'Test message', затем покажи текущую метку времени и значение переменной окружения HOME"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
