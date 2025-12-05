#!/bin/bash

# Script to run Docker config tests
# Usage: ./scripts/test-docker-config.sh [unit|integration|all]

set -e

MODE=${1:-all}

echo "Running Docker config tests in mode: $MODE"

case $MODE in
  unit)
    echo "Running unit tests..."
    npm test -- tests/unit/docker/
    ;;
  integration)
    echo "Running integration tests (requires Docker)..."
    RUN_DOCKER_TESTS=true npm run test:integration -- tests/integration/docker/
    ;;
  all)
    echo "Running all Docker config tests..."
    npm test -- tests/unit/docker/
    if command -v docker &> /dev/null; then
      echo "Docker found, running integration tests..."
      RUN_DOCKER_TESTS=true npm run test:integration -- tests/integration/docker/
    else
      echo "Docker not found, skipping integration tests"
    fi
    ;;
  coverage)
    echo "Running Docker config tests with coverage..."
    npm run test:coverage -- tests/unit/docker/
    ;;
  security)
    echo "Running security-focused tests..."
    npm test -- tests/unit/docker/config-security.test.ts tests/unit/docker/parse-config.test.ts
    ;;
  *)
    echo "Usage: $0 [unit|integration|all|coverage|security]"
    exit 1
    ;;
esac

echo "Docker config tests completed!"