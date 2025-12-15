# Context7 MCP profile

Context7 is an MCP server that provides up-to-date, version-aware

documentation and code examples for many libraries and frameworks.

In this lab it is used by:

- `skill.context7_docs` – a skill that fetches documentation before

  working on a project.

## Runtime variants

There are two main ways to use Context7 as an MCP server:

1. **Remote HTTP MCP server**

   The MCP server is hosted by Context7:

   - URL: `https://mcp.context7.com/mcp`

   Example client configuration (conceptual):

   ```json
   {
     "mcpServers": {
       "context7": {
         "url": "https://mcp.context7.com/mcp",
         "headers": {
           "CONTEXT7_API_KEY": "YOUR_API_KEY"
         }
       }
     }
   }
   ```

2. **Local MCP process via npm**

   The MCP server is started locally via npm:

   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "npx",
         "args": ["-y", "@upstash/context7-mcp"],
         "env": {
           "CONTEXT7_API_KEY": "${env:CONTEXT7_API_KEY}"
         }
       }
     }
   }
   ```

   In this case the API key is read from the user-level environment variable

   `CONTEXT7_API_KEY`.

## API keys

Context7 requires an API key:

- The key is obtained from the Context7 dashboard.

- In this lab we assume it is stored as a user-level environment variable:

  name: `CONTEXT7_API_KEY`.

- Runtime bindings may reference this variable name, but never include the

  actual secret value.

## Binding in skill.context7_docs

The skill `skill.context7_docs` has a runtime binding:

- File: `skills/context7_docs/impl/bindings/context7_mcp_remote_v1.json`

- Schema: `core/mova/ds/ds.skill_runtime_binding_v1.schema.json`

- Runtime type: `"mcp"`

- MCP server name: `"context7"`

- Default tool: `"get-library-docs"`

This binding describes how the skill is supposed to use Context7. The actual

IDE or MCP client is responsible for providing the concrete configuration

(remote URL or local command) and the API key.

