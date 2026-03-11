---
name: sample_skill
description: A demonstration skill that shows how to use the sample extension's tools effectively
tools:
  - sample_extension_sample_tool
  - sample_extension_data_processor
  - read_file
  - write_file
---

# Sample Skill

This skill demonstrates how to effectively use the sample extension's tools.

## When to Use

Use this skill when you need to:

1. Process and transform text messages
2. Analyze data files
3. Generate statistics from data

## Workflow

### Step 1: Read the Data

First, read the data file to understand its structure:

```
Use read_file to examine the data file
```

### Step 2: Process the Data

Use the appropriate tool based on the data type:

For text processing:

```
Use sample_tool with the extracted text
```

For data analysis:

```
Use data_processor with operation "analyze"
```

### Step 3: Generate Report

Format the results and save them:

```
Use write_file to save the processed results
```

## Examples

### Example 1: Text Processing

```
User: Process the message "Hello World" in uppercase

AI: I'll use the sample_tool to process this message.

Using sample_extension_sample_tool with:
- message: "Hello World"
- uppercase: true

Result: HELLO WORLD
```

### Example 2: Data Analysis

```
User: Analyze the sales.csv file

AI: Let me first read and then analyze the file.

Using data_processor with:
- filePath: "sales.csv"
- operation: "analyze"

Result: { count: 100, types: {...}, sample: [...] }
```

## Best Practices

1. Always check file existence before processing
2. Use appropriate operations for data types
3. Handle errors gracefully
4. Log important operations for debugging
