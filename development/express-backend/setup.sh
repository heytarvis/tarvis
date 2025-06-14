#!/bin/bash

# Install dependencies
pnpm install express cors ws dotenv

# Install dev dependencies
pnpm install --save-dev typescript @types/node @types/express @types/cors @types/ws

# Create dist directory
mkdir -p dist

# Build TypeScript
pnpm run build 