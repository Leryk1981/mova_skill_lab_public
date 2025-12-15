# Implementation layer for skill.context7_docs

This folder contains the executable part of the skill:

- `prompts/` – prompts or instructions for LLM agents that orchestrate Context7 usage

- `code/` – helper scripts, if needed

- `bindings/` – runtime bindings describing how to connect to Context7 MCP

## MCP client configuration

This skill depends on an external MCP client (Cursor, VS Code, Claude, etc.)

to actually connect to Context7.

Important points:

- The binding file

  `impl/bindings/context7_mcp_remote_v1.json` describes the logical contract:

  which MCP server name to use (`context7`), which tool (`get-library-docs`),

  and which runtime type (`mcp`).

- The real MCP configuration (URL, command, headers, environment variables)

  lives in the developer's environment (for example `.cursor/mcp.json`

  or a global MCP client config), not in this repository.

- The API key is provided via the `CONTEXT7_API_KEY` environment variable

  or through local MCP client configuration that is not tracked by git.

