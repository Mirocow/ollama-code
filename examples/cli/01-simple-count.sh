#!/bin/bash
# Simple test: count from 1 to 5
# Expected: Model should call python_dev tool and output numbers 1-5

ollama-code --model krith/qwen2.5-coder-14b-instruct:IQ4_XS --yolo "Посчитай от 1 до 5"
