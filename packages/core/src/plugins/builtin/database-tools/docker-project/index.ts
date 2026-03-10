/**
 * @license
 * Copyright 2025 Ollama Code Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Docker Project Tool
 * 
 * Provides intelligent Docker project management:
 * - Auto-generates Dockerfile based on project type
 * - Creates docker-compose.yml for multi-service setups
 * - Generates Makefile for common operations
 * - Builds and runs containers
 * - Analyzes logs and suggests fixes
 */

import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
  type ToolResult,
  type ToolResultDisplay,
} from '../../../../tools/tools.js';
import { ToolErrorType } from '../../../../tools/tool-error.js';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================================
// Types
// ============================================================================

export type DockerProjectOperation =
  | 'analyze'
  | 'init'
  | 'build'
  | 'run'
  | 'logs'
  | 'analyze_logs'
  | 'stop'
  | 'clean'
  | 'status';

export interface ProjectInfo {
  type: 'node' | 'python' | 'go' | 'rust' | 'java' | 'php' | 'ruby' | 'dotnet' | 'unknown';
  name: string;
  entrypoint: string;
  port: number;
  dependencies: string[];
  buildCommand: string;
  startCommand: string;
  testCommand: string;
  environmentVars: string[];
}

export interface DockerProjectParams {
  operation: DockerProjectOperation;
  projectPath?: string;
  options?: {
    port?: number;
    imageName?: string;
    containerName?: string;
    env?: Record<string, string>;
    volumes?: string[];
    buildArgs?: Record<string, string>;
    detach?: boolean;
    tail?: number;
    follow?: boolean;
  };
}

// ============================================================================
// Project Detection
// ============================================================================

function detectProjectType(projectPath: string): ProjectInfo {
  const files = fs.readdirSync(projectPath);
  const projectName = path.basename(projectPath);
  
  // Node.js detection
  if (files.includes('package.json')) {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    
    let type: ProjectInfo['type'] = 'node';
    let entrypoint = 'index.js';
    let startCommand = 'npm start';
    let port = 3000;
    
    // Detect framework
    if (deps.includes('next')) {
      type = 'node';
      entrypoint = 'next start';
      port = 3000;
      startCommand = 'npm run start';
    } else if (deps.includes('express')) {
      entrypoint = pkg.main || 'index.js';
      startCommand = 'npm start';
    } else if (deps.includes('nestjs') || deps.includes('@nestjs/core')) {
      entrypoint = 'dist/main.js';
      startCommand = 'npm run start:prod';
    }
    
    return {
      type,
      name: projectName,
      entrypoint,
      port,
      dependencies: [...deps, ...devDeps],
      buildCommand: pkg.scripts?.build || 'npm run build',
      startCommand,
      testCommand: pkg.scripts?.test || 'npm test',
      environmentVars: ['NODE_ENV', 'PORT'],
    };
  }
  
  // Python detection
  if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('setup.py')) {
    let entrypoint = 'main.py';
    let port = 8000;
    let startCommand = 'python main.py';
    let deps: string[] = [];
    
    // Check for common frameworks
    if (files.includes('pyproject.toml')) {
      const pyproject = fs.readFileSync(path.join(projectPath, 'pyproject.toml'), 'utf-8');
      if (pyproject.includes('fastapi')) {
        entrypoint = 'app/main.py';
        startCommand = 'uvicorn app.main:app --host 0.0.0.0 --port 8000';
        port = 8000;
      } else if (pyproject.includes('django')) {
        entrypoint = 'manage.py';
        startCommand = 'python manage.py runserver 0.0.0.0:8000';
        port = 8000;
      }
    }
    
    if (files.includes('requirements.txt')) {
      deps = fs.readFileSync(path.join(projectPath, 'requirements.txt'), 'utf-8').split('\n').filter(Boolean);
      const reqs = deps.join('\n');
      if (reqs.includes('fastapi')) {
        startCommand = 'uvicorn main:app --host 0.0.0.0 --port 8000';
      } else if (reqs.includes('flask')) {
        startCommand = 'python app.py';
      }
    }
    
    return {
      type: 'python',
      name: projectName,
      entrypoint,
      port,
      dependencies: deps,
      buildCommand: 'pip install -r requirements.txt',
      startCommand,
      testCommand: 'pytest',
      environmentVars: ['PYTHONUNBUFFERED', 'PYTHONDONTWRITEBYTECODE'],
    };
  }
  
  // Go detection
  if (files.includes('go.mod')) {
    return {
      type: 'go',
      name: projectName,
      entrypoint: 'main.go',
      port: 8080,
      dependencies: [],
      buildCommand: 'go build -o app .',
      startCommand: './app',
      testCommand: 'go test ./...',
      environmentVars: ['CGO_ENABLED', 'GOOS', 'GOARCH'],
    };
  }
  
  // Rust detection
  if (files.includes('Cargo.toml')) {
    return {
      type: 'rust',
      name: projectName,
      entrypoint: 'src/main.rs',
      port: 8080,
      dependencies: [],
      buildCommand: 'cargo build --release',
      startCommand: './target/release/app',
      testCommand: 'cargo test',
      environmentVars: ['RUST_LOG', 'ROCKET_PORT'],
    };
  }
  
  // Java detection
  if (files.includes('pom.xml') || files.includes('build.gradle')) {
    return {
      type: 'java',
      name: projectName,
      entrypoint: 'src/main/java/Main.java',
      port: 8080,
      dependencies: [],
      buildCommand: files.includes('pom.xml') ? 'mvn package' : './gradlew build',
      startCommand: 'java -jar target/app.jar',
      testCommand: files.includes('pom.xml') ? 'mvn test' : './gradlew test',
      environmentVars: ['JAVA_OPTS', 'SPRING_PROFILES_ACTIVE'],
    };
  }
  
  // PHP detection
  if (files.includes('composer.json')) {
    return {
      type: 'php',
      name: projectName,
      entrypoint: 'public/index.php',
      port: 8000,
      dependencies: [],
      buildCommand: 'composer install',
      startCommand: 'php -S 0.0.0.0:8000 -t public',
      testCommand: 'php artisan test',
      environmentVars: ['APP_ENV', 'APP_DEBUG'],
    };
  }
  
  // Ruby detection
  if (files.includes('Gemfile')) {
    return {
      type: 'ruby',
      name: projectName,
      entrypoint: 'app.rb',
      port: 3000,
      dependencies: [],
      buildCommand: 'bundle install',
      startCommand: 'ruby app.rb',
      testCommand: 'rspec',
      environmentVars: ['RAILS_ENV', 'RACK_ENV'],
    };
  }
  
  // .NET detection
  if (files.some(f => f.endsWith('.csproj') || f.endsWith('.fsproj'))) {
    return {
      type: 'dotnet',
      name: projectName,
      entrypoint: 'Program.cs',
      port: 5000,
      dependencies: [],
      buildCommand: 'dotnet build',
      startCommand: 'dotnet run',
      testCommand: 'dotnet test',
      environmentVars: ['ASPNETCORE_ENVIRONMENT', 'ASPNETCORE_URLS'],
    };
  }
  
  // Unknown type
  return {
    type: 'unknown',
    name: projectName,
    entrypoint: 'main',
    port: 8080,
    dependencies: [],
    buildCommand: 'make build',
    startCommand: 'make run',
    testCommand: 'make test',
    environmentVars: [],
  };
}

// ============================================================================
// Dockerfile Generation
// ============================================================================

function generateDockerfile(info: ProjectInfo, port: number): string {
  const lines: string[] = ['# Auto-generated Dockerfile by Ollama Code'];
  
  switch (info.type) {
    case 'node':
      lines.push('FROM node:20-alpine');
      lines.push('WORKDIR /app');
      lines.push('COPY package*.json ./');
      lines.push('RUN npm ci --only=production');
      lines.push('COPY . .');
      if (info.buildCommand !== 'npm start') {
        lines.push(`RUN ${info.buildCommand}`);
      }
      lines.push(`EXPOSE ${port}`);
      lines.push('CMD ["npm", "start"]');
      break;
      
    case 'python':
      lines.push('FROM python:3.12-slim');
      lines.push('WORKDIR /app');
      lines.push('COPY requirements.txt .');
      lines.push('RUN pip install --no-cache-dir -r requirements.txt');
      lines.push('COPY . .');
      lines.push(`EXPOSE ${port}`);
      lines.push(`CMD ["sh", "-c", "${info.startCommand}"]`);
      break;
      
    case 'go':
      lines.push('FROM golang:1.22-alpine AS builder');
      lines.push('WORKDIR /app');
      lines.push('COPY go.mod go.sum ./');
      lines.push('RUN go mod download');
      lines.push('COPY . .');
      lines.push('RUN CGO_ENABLED=0 GOOS=linux go build -o main .');
      lines.push('');
      lines.push('FROM alpine:latest');
      lines.push('RUN apk --no-cache add ca-certificates');
      lines.push('WORKDIR /root/');
      lines.push('COPY --from=builder /app/main .');
      lines.push(`EXPOSE ${port}`);
      lines.push('CMD ["./main"]');
      break;
      
    case 'rust':
      lines.push('FROM rust:1.75 AS builder');
      lines.push('WORKDIR /app');
      lines.push('COPY Cargo.toml Cargo.lock ./');
      lines.push('COPY src ./src');
      lines.push('RUN cargo build --release');
      lines.push('');
      lines.push('FROM debian:bookworm-slim');
      lines.push('RUN apt-get update && apt-get install -y libssl3 && rm -rf /var/lib/apt/lists/*');
      lines.push('WORKDIR /app');
      lines.push('COPY --from=builder /app/target/release/app /usr/local/bin/app');
      lines.push(`EXPOSE ${port}`);
      lines.push('CMD ["app"]');
      break;
      
    case 'java':
      lines.push('FROM eclipse-temurin:21-jdk-alpine AS builder');
      lines.push('WORKDIR /app');
      lines.push('COPY pom.xml .');
      lines.push('COPY src ./src');
      lines.push('RUN ./mvnw package -DskipTests');
      lines.push('');
      lines.push('FROM eclipse-temurin:21-jre-alpine');
      lines.push('WORKDIR /app');
      lines.push('COPY --from=builder /app/target/*.jar app.jar');
      lines.push(`EXPOSE ${port}`);
      lines.push('CMD ["java", "-jar", "app.jar"]');
      break;
      
    case 'php':
      lines.push('FROM php:8.2-fpm-alpine');
      lines.push('WORKDIR /var/www/html');
      lines.push('RUN apk add --no-cache composer');
      lines.push('COPY composer.json composer.lock ./');
      lines.push('RUN composer install --no-dev');
      lines.push('COPY . .');
      lines.push(`EXPOSE ${port}`);
      lines.push('CMD ["php-fpm"]');
      break;
      
    default:
      lines.push('FROM alpine:latest');
      lines.push('WORKDIR /app');
      lines.push('COPY . .');
      lines.push(`EXPOSE ${port}`);
      lines.push('CMD ["./start.sh"]');
  }
  
  return lines.join('\n');
}

// ============================================================================
// Docker Compose Generation
// ============================================================================

function generateDockerCompose(
  info: ProjectInfo,
  port: number,
  imageName: string,
  env?: Record<string, string>,
  volumes?: string[],
): string {
  const serviceName = info.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const compose = {
    version: '3.8',
    services: {
      [serviceName]: {
        build: {
          context: '.',
          dockerfile: 'Dockerfile',
        },
        image: imageName,
        container_name: imageName,
        ports: [`${port}:${info.port}`],
        environment: {
          NODE_ENV: 'production',
          PORT: info.port,
          ...env,
        },
        restart: 'unless-stopped',
        ...(volumes && volumes.length > 0 ? { volumes } : {}),
      },
    },
  };
  
  return `# Auto-generated docker-compose.yml by Ollama Code
# Usage: docker compose up -d

${JSON.stringify(compose, null, 2)}`;
}

// ============================================================================
// Makefile Generation
// ============================================================================

function generateMakefile(info: ProjectInfo, port: number, imageName: string): string {
  return `# Auto-generated Makefile by Ollama Code
# Docker project management commands

.PHONY: build run stop logs clean restart shell test status help

# Default target
help:
	@echo "Available commands:"
	@echo "  make build    - Build Docker image"
	@echo "  make run      - Run container in background"
	@echo "  make stop     - Stop container"
	@echo "  make logs     - View container logs"
	@echo "  make restart  - Restart container"
	@echo "  make shell    - Open shell in container"
	@echo "  make test     - Run tests in container"
	@echo "  make clean    - Remove container and image"
	@echo "  make status   - Show container status"

# Build the Docker image
build:
	docker build -t ${imageName} .

# Run container in background
run:
	docker run -d \\
		--name ${imageName} \\
		-p ${port}:${info.port} \\
		--restart unless-stopped \\
		${imageName}

# Stop the container
stop:
	docker stop ${imageName} 2>/dev/null || true
	docker rm ${imageName} 2>/dev/null || true

# View logs
logs:
	docker logs -f ${imageName}

# Restart container
restart: stop run

# Open shell in container
shell:
	docker exec -it ${imageName} /bin/sh

# Run tests
test:
	docker run --rm ${imageName} ${info.testCommand}

# Clean up
clean: stop
	docker rmi ${imageName} 2>/dev/null || true

# Show status
status:
	@docker ps -a --filter "name=${imageName}" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
`;
}

// ============================================================================
// Log Analysis
// ============================================================================

interface LogAnalysis {
  hasErrors: boolean;
  errorTypes: string[];
  suggestions: string[];
  criticalLines: string[];
}

function analyzeLogs(logs: string, projectType: string): LogAnalysis {
  const lines = logs.split('\n');
  const errorPatterns = [
    { pattern: /error:/i, type: 'General Error' },
    { pattern: /exception:/i, type: 'Exception' },
    { pattern: /failed to/i, type: 'Failure' },
    { pattern: /cannot find module/i, type: 'Missing Module' },
    { pattern: /ENOENT/i, type: 'File Not Found' },
    { pattern: /ECONNREFUSED/i, type: 'Connection Refused' },
    { pattern: /ETIMEDOUT/i, type: 'Timeout' },
    { pattern: /out of memory/i, type: 'Memory Error' },
    { pattern: /permission denied/i, type: 'Permission Error' },
    { pattern: /port.*already in use/i, type: 'Port Conflict' },
    { pattern: /segmentation fault/i, type: 'Segmentation Fault' },
    { pattern: /panic:/i, type: 'Panic (Go/Rust)' },
    { pattern: /stack trace/i, type: 'Stack Trace' },
    { pattern: /npm ERR!/i, type: 'NPM Error' },
    { pattern: /pip.*error/i, type: 'PIP Error' },
    { pattern: /importerror/i, type: 'Import Error (Python)' },
    { pattern: /modulenotfound/i, type: 'Module Not Found (Python)' },
    { pattern: /syntaxerror/i, type: 'Syntax Error' },
    { pattern: /TypeError/i, type: 'Type Error' },
    { pattern: /ReferenceError/i, type: 'Reference Error' },
  ];
  
  const errorTypes: string[] = [];
  const criticalLines: string[] = [];
  const suggestions: string[] = [];
  
  for (const line of lines) {
    for (const { pattern, type } of errorPatterns) {
      if (pattern.test(line)) {
        if (!errorTypes.includes(type)) {
          errorTypes.push(type);
        }
        criticalLines.push(line.trim());
      }
    }
  }
  
  // Generate suggestions based on error types
  if (errorTypes.includes('Missing Module') || errorTypes.includes('Module Not Found (Python)')) {
    suggestions.push('📦 Missing dependency detected. Try:');
    if (projectType === 'node') {
      suggestions.push('   - Run `npm install` or check package.json');
      suggestions.push('   - Verify the module is in dependencies');
    } else if (projectType === 'python') {
      suggestions.push('   - Run `pip install -r requirements.txt`');
      suggestions.push('   - Check if the module is listed in requirements.txt');
    }
  }
  
  if (errorTypes.includes('Connection Refused')) {
    suggestions.push('🔌 Connection refused. Check:');
    suggestions.push('   - Is the target service running?');
    suggestions.push('   - Are the host/port correct?');
    suggestions.push('   - Are there network/firewall issues?');
  }
  
  if (errorTypes.includes('Port Conflict')) {
    suggestions.push('🚪 Port already in use. Try:');
    suggestions.push('   - Use a different port with -p option');
    suggestions.push('   - Stop the conflicting service');
    suggestions.push('   - Run `lsof -i :PORT` to identify the process');
  }
  
  if (errorTypes.includes('Memory Error')) {
    suggestions.push('💾 Memory issue detected. Try:');
    suggestions.push('   - Increase Docker memory limits');
    suggestions.push('   - Optimize memory usage in code');
    suggestions.push('   - Use --memory flag when running');
  }
  
  if (errorTypes.includes('Permission Error')) {
    suggestions.push('🔒 Permission denied. Try:');
    suggestions.push('   - Check file permissions');
    suggestions.push('   - Run with appropriate user');
    suggestions.push('   - Check Docker volume permissions');
  }
  
  if (errorTypes.includes('Syntax Error') || errorTypes.includes('Type Error')) {
    suggestions.push('🐛 Code error detected. Try:');
    suggestions.push('   - Review the code for syntax errors');
    suggestions.push('   - Check for type mismatches');
    suggestions.push('   - Run linting/type checking');
  }
  
  return {
    hasErrors: errorTypes.length > 0,
    errorTypes,
    suggestions,
    criticalLines: criticalLines.slice(0, 20),
  };
}

// ============================================================================
// Docker Operations
// ============================================================================

function executeDocker(
  args: string,
  timeout = 120000,
): { stdout: string; stderr: string; success: boolean } {
  try {
    const stdout = execSync(`docker ${args}`, {
      encoding: 'utf-8',
      timeout,
      maxBuffer: 50 * 1024 * 1024,
    });
    return { stdout, stderr: '', success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      stdout: '',
      stderr: errorMessage,
      success: false,
    };
  }
}

// ============================================================================
// Tool Invocation
// ============================================================================

class DockerProjectInvocation extends BaseToolInvocation<
  DockerProjectParams,
  ToolResult
> {
  constructor(params: DockerProjectParams) {
    super(params);
  }

  getDescription(): string {
    const { operation } = this.params;
    const descriptions: Record<DockerProjectOperation, string> = {
      analyze: 'Analyzing project for Dockerization',
      init: 'Creating Docker configuration files',
      build: 'Building Docker image',
      run: 'Running Docker container',
      logs: 'Fetching container logs',
      analyze_logs: 'Analyzing container logs for errors',
      stop: 'Stopping Docker container',
      clean: 'Cleaning up Docker resources',
      status: 'Checking Docker status',
    };
    return descriptions[operation] || `Docker project operation: ${operation}`;
  }

  async execute(
    _signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    const { operation, projectPath, options } = this.params;
    const workPath = projectPath || process.cwd();
    
    try {
      // Check if Docker is available
      const dockerCheck = executeDocker('version --format "{{.Version}}"');
      if (!dockerCheck.success) {
        return {
          llmContent: `❌ Docker is not available. Please ensure Docker is installed and running.\n\nError: ${dockerCheck.stderr}`,
          returnDisplay: 'Docker not available',
        };
      }

      let result: string;
      let display: string;

      switch (operation) {
        case 'analyze': {
          const info = detectProjectType(workPath);
          result = `## 📊 Project Analysis

**Project:** ${info.name}
**Type:** ${info.type.toUpperCase()}
**Entrypoint:** ${info.entrypoint}
**Default Port:** ${info.port}

### Build & Run
- **Build:** \`${info.buildCommand}\`
- **Start:** \`${info.startCommand}\`
- **Test:** \`${info.testCommand}\`

### Dependencies (${info.dependencies.length})
${info.dependencies.length > 0 
  ? info.dependencies.slice(0, 10).map(d => `- ${d}`).join('\n') + (info.dependencies.length > 10 ? `\n... and ${info.dependencies.length - 10} more` : '')
  : 'None detected'}

### Ready for Docker
Run \`docker_project init\` to create Dockerfile, docker-compose.yml, and Makefile.
`;
          display = `Analyzed ${info.type} project`;
          break;
        }

        case 'init': {
          const info = detectProjectType(workPath);
          const port = options?.port || info.port;
          const imageName = options?.imageName || `${info.name.toLowerCase()}-app`;
          
          const dockerfile = generateDockerfile(info, port);
          const dockerCompose = generateDockerCompose(info, port, imageName, options?.env, options?.volumes);
          const makefile = generateMakefile(info, port, imageName);
          
          // Write files
          fs.writeFileSync(path.join(workPath, 'Dockerfile'), dockerfile, 'utf-8');
          fs.writeFileSync(path.join(workPath, 'docker-compose.yml'), dockerCompose, 'utf-8');
          fs.writeFileSync(path.join(workPath, 'Makefile'), makefile, 'utf-8');
          
          // Create .dockerignore if not exists
          const dockerignorePath = path.join(workPath, '.dockerignore');
          if (!fs.existsSync(dockerignorePath)) {
            const dockerignore = `node_modules
npm-debug.log
Dockerfile
docker-compose.yml
.docker
.git
.gitignore
README.md
.env
.env.*
*.log
coverage
.nyc_output
dist
build
target
__pycache__
*.pyc
.pytest_cache
.venv
venv
`;
            fs.writeFileSync(dockerignorePath, dockerignore, 'utf-8');
          }
          
          result = `## ✅ Docker Configuration Created

### Files Generated
- **Dockerfile** - Multi-stage build for ${info.type} project
- **docker-compose.yml** - Container orchestration config
- **Makefile** - Convenient commands for Docker operations
- **.dockerignore** - Excludes unnecessary files from build

### Quick Start
\`\`\`bash
# Build and run
make build run

# View logs
make logs

# Stop
make stop
\`\`\`

### Or use docker-compose
\`\`\`bash
docker compose up -d
docker compose logs -f
docker compose down
\`\`\`

### Container Details
- **Image:** ${imageName}
- **Port:** ${port}
- **Type:** ${info.type}
`;
          display = 'Docker files created';
          break;
        }

        case 'build': {
          const info = detectProjectType(workPath);
          const imageName = options?.imageName || `${info.name.toLowerCase()}-app`;
          
          const buildResult = executeDocker(`build -t ${imageName} .`, 600000);
          
          if (!buildResult.success) {
            result = `## ❌ Build Failed

\`\`\`
${buildResult.stderr}
\`\`\`

### Common Solutions
1. Check Dockerfile syntax
2. Ensure all dependencies are available
3. Verify build context and paths
4. Check available disk space
`;
            display = 'Build failed';
          } else {
            result = `## ✅ Build Successful

**Image:** ${imageName}

### Next Steps
\`\`\`bash
# Run the container
docker_project run --imageName ${imageName}

# Or manually
docker run -d -p ${options?.port || info.port}:${info.port} ${imageName}
\`\`\`
`;
            display = `Image ${imageName} built`;
          }
          break;
        }

        case 'run': {
          const info = detectProjectType(workPath);
          const imageName = options?.imageName || `${info.name.toLowerCase()}-app`;
          const containerName = options?.containerName || imageName;
          const port = options?.port || info.port;
          
          // Build environment args
          const envArgs = options?.env 
            ? Object.entries(options.env).map(([k, v]) => `-e ${k}=${v}`).join(' ')
            : '';
          
          // Build volume args
          const volArgs = options?.volumes
            ? options?.volumes.map(v => `-v ${v}`).join(' ')
            : '';
          
          // Stop existing container
          executeDocker(`stop ${containerName} 2>/dev/null || true`);
          executeDocker(`rm ${containerName} 2>/dev/null || true`);
          
          const runResult = executeDocker(
            `run -d --name ${containerName} -p ${port}:${info.port} ${envArgs} ${volArgs} --restart unless-stopped ${imageName}`
          );
          
          if (!runResult.success) {
            result = `## ❌ Run Failed

\`\`\`
${runResult.stderr}
\`\`\`

### Troubleshooting
1. Ensure the image exists: \`docker images\`
2. Check if port ${port} is available
3. Verify container name is unique
`;
            display = 'Run failed';
          } else {
            result = `## ✅ Container Running

**Container:** ${containerName}
**Image:** ${imageName}
**Port:** ${port}

### Commands
\`\`\`bash
# View logs
docker logs -f ${containerName}

# Stop container
docker stop ${containerName}

# Open shell
docker exec -it ${containerName} /bin/sh
\`\`\`
`;
            display = `Container ${containerName} running`;
          }
          break;
        }

        case 'logs': {
          const containerName = options?.containerName || options?.imageName || 'app';
          const tail = options?.tail || 100;
          
          const logsResult = executeDocker(`logs --tail ${tail} ${containerName}`);
          
          if (!logsResult.success) {
            result = `## ❌ Failed to get logs

Container "${containerName}" not found or not running.

Run \`docker ps -a\` to see available containers.
`;
            display = 'Logs failed';
          } else {
            const logs = logsResult.stdout || logsResult.stderr;
            result = `## 📋 Container Logs (${containerName})

\`\`\`
${logs.slice(-10000)}
\`\`\`

---
Use \`docker_project analyze_logs\` to analyze errors.
`;
            display = 'Logs retrieved';
          }
          break;
        }

        case 'analyze_logs': {
          const containerName = options?.containerName || options?.imageName || 'app';
          const tail = options?.tail || 500;
          
          const logsResult = executeDocker(`logs --tail ${tail} ${containerName}`);
          
          if (!logsResult.success) {
            result = `## ❌ Failed to get logs

Container "${containerName}" not found.
`;
            display = 'Analysis failed';
          } else {
            const logs = logsResult.stdout + logsResult.stderr;
            const info = detectProjectType(workPath);
            const analysis = analyzeLogs(logs, info.type);
            
            if (analysis.hasErrors) {
              result = `## 🔍 Log Analysis Results

### Error Types Detected
${analysis.errorTypes.map(t => `- ❗ ${t}`).join('\n')}

### Critical Lines
\`\`\`
${analysis.criticalLines.slice(0, 10).join('\n')}
\`\`\`

### 🔧 Suggested Fixes
${analysis.suggestions.join('\n')}

---
Run \`docker logs ${containerName}\` for full logs.
`;
            } else {
              result = `## ✅ No Errors Detected

The container logs appear healthy. No critical errors were found.

### Recent Activity
\`\`\`
${logs.slice(-500)}
\`\`\`
`;
            }
            display = analysis.hasErrors ? 'Errors found' : 'No errors';
          }
          break;
        }

        case 'stop': {
          const containerName = options?.containerName || options?.imageName || 'app';
          
          executeDocker(`stop ${containerName} 2>/dev/null || true`);
          executeDocker(`rm ${containerName} 2>/dev/null || true`);
          
          result = `## ✅ Container Stopped

**Container:** ${containerName}

To start again, run \`docker_project run\`.
`;
          display = `Container ${containerName} stopped`;
          break;
        }

        case 'clean': {
          const info = detectProjectType(workPath);
          const imageName = options?.imageName || `${info.name.toLowerCase()}-app`;
          
          // Stop and remove container
          executeDocker(`stop ${imageName} 2>/dev/null || true`);
          executeDocker(`rm ${imageName} 2>/dev/null || true`);
          
          // Remove image
          executeDocker(`rmi ${imageName} 2>/dev/null || true`);
          
          result = `## ✅ Cleanup Complete

Removed:
- Container: ${imageName}
- Image: ${imageName}

To rebuild, run \`docker_project build\`.
`;
          display = 'Cleanup complete';
          break;
        }

        case 'status': {
          const info = detectProjectType(workPath);
          const imageName = options?.imageName || `${info.name.toLowerCase()}-app`;
          
          const psResult = executeDocker(`ps -a --filter "name=${imageName}" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Image}}"`);
          const imagesResult = executeDocker(`images ${imageName} --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}\\t{{.CreatedAt}}"`);
          
          result = `## 📊 Docker Status

### Container
${psResult.success && psResult.stdout ? psResult.stdout : 'No container found'}

### Image
${imagesResult.success && imagesResult.stdout ? imagesResult.stdout : 'No image found'}

### Quick Actions
\`\`\`bash
# View logs
docker_project logs

# Stop container
docker_project stop

# Clean up
docker_project clean
\`\`\`
`;
          display = 'Status retrieved';
          break;
        }

        default:
          return {
            llmContent: `Unknown operation: ${operation}`,
            returnDisplay: 'Unknown operation',
            error: {
              message: `Unknown operation: ${operation}`,
              type: ToolErrorType.INVALID_TOOL_PARAMS,
            },
          };
      }

      return {
        llmContent: result,
        returnDisplay: display,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Docker operation failed: ${errorMessage}`,
        returnDisplay: errorMessage,
        error: {
          message: errorMessage,
          type: ToolErrorType.EXECUTION_FAILED,
        },
      };
    }
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

export class DockerProjectTool extends BaseDeclarativeTool<DockerProjectParams, ToolResult> {
  static readonly Name = 'docker_project';
  
  constructor() {
    super(
      DockerProjectTool.Name,
      'DockerProject',
      `Intelligent Docker project management tool.

OPERATIONS:
- analyze: Analyze project and detect type (Node.js, Python, Go, Rust, etc.)
- init: Create Dockerfile, docker-compose.yml, Makefile, .dockerignore
- build: Build Docker image from project
- run: Run container with auto-detected settings
- logs: View container logs
- analyze_logs: Analyze logs for errors and suggest fixes
- stop: Stop running container
- clean: Remove container and image
- status: Show container and image status

This tool automatically:
1. Detects project type (Node.js, Python, Go, Rust, Java, PHP, Ruby, .NET)
2. Creates optimized Dockerfile for the detected type
3. Generates docker-compose.yml with health checks
4. Creates Makefile with common commands
5. Analyzes container logs and suggests fixes

Use this to containerize any project and run it in Docker.`,
      Kind.Execute,
      {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['analyze', 'init', 'build', 'run', 'logs', 'analyze_logs', 'stop', 'clean', 'status'],
            description: 'Docker project operation to perform',
          },
          projectPath: {
            type: 'string',
            description: 'Path to project directory (default: current directory)',
          },
          options: {
            type: 'object',
            properties: {
              port: { type: 'number', description: 'Port to expose' },
              imageName: { type: 'string', description: 'Docker image name' },
              containerName: { type: 'string', description: 'Container name' },
              env: { type: 'object', description: 'Environment variables' },
              volumes: { type: 'array', items: { type: 'string' }, description: 'Volume mounts' },
              tail: { type: 'number', description: 'Number of log lines' },
            },
          },
        },
        required: ['operation'],
      },
      true, // isOutputMarkdown
      false, // canUpdateOutput
    );
  }

  protected override createInvocation(params: DockerProjectParams): DockerProjectInvocation {
    return new DockerProjectInvocation(params);
  }
}

export const dockerProjectTool = new DockerProjectTool();
export default dockerProjectTool;
