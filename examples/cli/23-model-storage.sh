#!/bin/bash
# Test: model_storage tool
# Expected: Model should store and retrieve data

PROMPT="Сохрани в хранилище (namespace: knowledge) ключ 'test_key' со значением 'test_value', затем прочитай его обратно"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
