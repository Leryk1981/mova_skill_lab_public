# Runtime and adapters layer

MOVA 4.0 does not execute anything by itself. Execution happens in external runtimes:

- local scripts,

- MCP servers,

- Cloudflare Workers,

- Claude Skills,

- Gemini Agents,

- and others.

In the Skills Lab we describe the link between a skill and its runtime via

**runtime bindings**:

- Schema: `core/mova/ds/ds.skill_runtime_binding_v1.schema.json`

- Instances: `skills/<skill_id>/impl/bindings/*.json`

This keeps the separation clear:

- Red core (`core/mova/`) – defines data contracts and episode format.

- Yellow skills (`skills/*`) – declare which data and envelopes they use.

- Green implementations (`impl/` and external runtimes) – provide the actual code,

  described by runtime bindings.

## Where runtimes live

MOVA 4.0 does not include any executable runtime code.

External runtimes live **outside** this repository:

- local scripts (Python, Node, etc.),

- MCP servers (such as Context7),

- Cloudflare Workers,

- Claude Skills,

- Gemini Agents,

- and others.

In this lab we only describe:

- which runtime type is used (`runtime_type` in `ds.skill_runtime_binding_v1`),

- how to address it (`entrypoint` object),

- which verbs it can execute.

The actual runtime code and its installation/configuration live in the

developer's environment (IDE, OS, cloud), not in this repo.

## Secrets and API keys

API keys and other secrets (Context7, OpenAI, Cloudflare, etc.) **must not**

be committed to this repository.

Instead:

- Binding documents may reference environment variables or placeholder names,

  for example `CONTEXT7_API_KEY`.

- Real secret values are stored in:

  - user-level environment variables on the OS (e.g. `CONTEXT7_API_KEY`),

  - local IDE or MCP client configuration files that are not tracked by git.

This keeps the MOVA contracts public and portable, while secrets remain local

to the developer's machine or deployment environment.

## MCP runtime profile (generic)

For `runtime_type = "mcp"` the binding describes how to reach an MCP server:

- `entrypoint.mcp_server` – logical name of the server (e.g. `"context7"`).

- `entrypoint.url` – HTTP/S endpoint for a remote MCP server, **or**

- `entrypoint.command` / `entrypoint.args` – how to start a local MCP process.

- `entrypoint.mcp_tool` – default MCP tool to invoke for this binding.

The binding does not contain client-specific configuration for a given IDE

(Cursor, VS Code, etc.). Those clients read their own config files and use

the information from the binding as a higher-level contract.

