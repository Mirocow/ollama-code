# Makefile for qwen-code

.PHONY: help install build build-sandbox build-all test lint format preflight clean start debug debug-attach release run-npx create-alias

help:
	@echo "Makefile for qwen-code"
	@echo ""
	@echo "Usage:"
	@echo "  make install          - Install npm dependencies"
	@echo "  make build            - Build the main project"
	@echo "  make build-all        - Build the main project and sandbox"
	@echo "  make test             - Run the test suite"
	@echo "  make lint             - Lint the code"
	@echo "  make format           - Format the code"
	@echo "  make preflight        - Run formatting, linting, and tests"
	@echo "  make clean            - Remove generated files"
	@echo "  make start            - Start the Qwen Code CLI"
	@echo "  make start ARGS='...' - Start with args: make start ARGS='--resume <id>'"
	@echo "  make debug            - Start in debug mode"
	@echo "  make debug-attach     - Start with inspector for VS Code attach"
	@echo ""
	@echo "Examples:"
	@echo "  make start ARGS='--resume'"
	@echo "  make debug ARGS='--resume deb246aa...'"
	@echo ""
	@echo "  make run-npx          - Run the CLI using npx"
	@echo "  make create-alias     - Create a 'qwen' alias"

install:
	npm install

build:
	npm run build

build-all:
	npm run build:all

test:
	npm run test

lint:
	npm run lint

format:
	npm run format

preflight:
	npm run preflight

clean:
	npm run clean

start:
	npm run start -- $(ARGS)

debug:
	npm run debug -- $(ARGS)

debug-attach:
	npm run debug:attach -- $(ARGS)

run-npx:
	npx https://github.com/QwenLM/qwen-code

create-alias:
	scripts/create_alias.sh
