#!/bin/bash
# Test: web_fetch tool
# Expected: Model should fetch content from a URL

PROMPT="Загрузи содержимое страницы https://example.com и покажи его"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
