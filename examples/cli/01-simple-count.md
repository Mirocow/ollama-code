# Example 1: Simple Counting

## Command

```bash
export OLLAMA_HOST="178.140.10.58:61434"
export OLLAMA_BASE_URL="http://178.140.10.58:61434"

pnpm run cli -- \
  --model "krith/qwen2.5-coder-14b-instruct:IQ4_XS" \
  --yolo \
  --prompt "Посчитай от 1 до 5"
```

## Expected Behavior

Model should:
1. Create TODO list
2. Write a simple program
3. Run it and output: 1, 2, 3, 4, 5

## Actual Output

```
1
2
3
4
5
```
