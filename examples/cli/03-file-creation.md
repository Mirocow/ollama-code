# Example 3: File Creation and Execution

## Command

```bash
export OLLAMA_HOST="178.140.10.58:61434"
export OLLAMA_BASE_URL="http://178.140.10.58:61434"

pnpm run cli -- \
  --model "krith/qwen2.5-coder-14b-instruct:IQ4_XS" \
  --yolo \
  --prompt "Напиши программу hello.py которая выводит Hello World, сохрани её в файл и запусти."
```

## Expected Behavior

Model should:
1. Create TODO list
2. Use `write_file` tool to create `/home/z/my-project/ollama-code/hello.py`
3. Use `python_dev` tool with `run` action to execute

## Expected Tools Used

```
1. todo_write - create task list
2. write_file - create hello.py with content: print('Hello World')
3. python_dev - action="run" script="/home/z/my-project/ollama-code/hello.py"
```

## Actual Output

```
Hello World
```

## Created File

`hello.py`:
```python
print('Hello World')
```
