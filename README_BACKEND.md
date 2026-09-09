# HyperGo Backend

This package runs HyperGo's frontend and Node.js search API together.

## Environment variable
Set `SERPER_API_KEY` in the hosting provider. Never put the key directly in source code or a public Git repository.

## Render
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Environment variable: `SERPER_API_KEY`
