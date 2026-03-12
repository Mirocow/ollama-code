# Makefile for Ollama Code

.PHONY: help install build build-all test lint format preflight clean start debug debug-attach web web-build web-start cli

help:
	@echo "Makefile for Ollama Code"
	@echo ""
	@echo "Usage:"
	@echo "  make install          - Install pnpm dependencies"
	@echo "  make build            - Build all packages"
	@echo "  make build-all        - Build all packages and sandbox"
	@echo "  make test             - Run the test suite"
	@echo "  make lint             - Lint the code"
	@echo "  make format           - Format the code"
	@echo "  make preflight        - Run formatting, linting, and tests"
	@echo "  make clean            - Remove generated files"
	@echo ""
	@echo "CLI (Terminal Interface):"
	@echo "  make cli              - Start Ollama Code CLI"
	@echo "  make cli ARGS='...'   - Start CLI with args: make cli ARGS='--resume <id>'"
	@echo "  make debug            - Start CLI in debug mode"
	@echo "  make debug-attach     - Start CLI with inspector for VS Code attach"
	@echo ""
	@echo "Web UI (Next.js Application):"
	@echo "  make web              - Start Web UI in development mode (port 3000)"
	@echo "  make web-build        - Build Web UI for production"
	@echo "  make web-start        - Start Web UI in production mode"
	@echo ""
	@echo "WebUI Components (Storybook):"
	@echo "  make webui-build      - Build webui component library"
	@echo "  make webui-storybook  - Start Storybook for webui components"
	@echo ""
	@echo "Examples:"
	@echo "  make cli ARGS='--resume'"
	@echo "  make debug ARGS='--resume deb246aa...'"
	@echo "  make web              # Open http://localhost:3000"

install:
	npx pnpm install

build:
	npx pnpm run build

build-all:
	npx pnpm run build:all

test:
	npx pnpm run test

lint:
	npx pnpm run lint

format:
	npx pnpm run format

preflight:
	npx pnpm run preflight

clean:
	npx pnpm run clean

# CLI commands
cli:
	npx pnpm run cli -- $(ARGS)

start:
	npx pnpm run cli -- $(ARGS)

debug:
	npx pnpm run cli:debug -- $(ARGS)

debug-attach:
	npx pnpm run debug:attach -- $(ARGS)

# Web UI commands
web:
	npx pnpm run web

web-build:
	npx pnpm run web:build

web-start:
	npx pnpm run web:start

# WebUI Components commands
webui-build:
	npx pnpm run webui:build

webui-storybook:
	npx pnpm run webui:storybook
