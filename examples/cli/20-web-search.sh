#!/bin/bash
# Test: web_search tool
# Expected: Model should search the web for information

PROMPT="Найди в интернете текущую погоду в Москве"

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "$PROMPT"
