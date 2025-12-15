# MOVA Skills Lab – Quickstart for IDE Users

## 1. Who this guide is for

You are a developer working in an IDE (VS Code, Cursor, or similar) with an AI assistant. Your project either embeds `mova_skills_lab/` as a subfolder or connects to it via MCP (Model Context Protocol). Instead of writing long prompts every time, you want to use MOVA skills—reusable, contract-first capabilities that follow standardized schemas and envelopes.

## 2. Minimal setup

- Ensure the repository contains `mova_skills_lab/` (subfolder) or an MCP server profile that exposes MOVA Skills Lab.
- Make sure your IDE agent is configured to:
  - read files from the repo,
  - run local commands (build/tests),
  - follow the `IDE_AGENT_PROFILE` and `IDE_AGENT_PROTOCOL_v1`.
- (Optional) Open `docs/09_IDE_AGENT_PROFILE.md` and `docs/IDE_AGENT_PROTOCOL_v1.md` to understand the agent's behavior.

## 3. First session in a new project

### Step 0 – Tell the agent about MOVA Skills Lab

Example phrases you can type:

- "You are an IDE agent. This repo contains a `mova_skills_lab/` folder. Use it as your skills backend. Work in this repository only."

- "Please discover the MOVA Skills Lab in this repo and tell me which core skills are available."

### Step 1 – Get a repository snapshot

Example phrases:

- "Use `skill.repo_snapshot_basic` to create a snapshot of this repository and save it as a markdown file under `docs/`."

- "Show me the snapshot and add a link to it in the README if it makes sense."

**What to expect**: A structured overview of the repo (directory tree, key files, build commands, current status, and suggested next steps).

### Step 2 – Ask for a change plan

Example phrases:

- "Now use `skill.repo_code_change_plan_basic` to propose a change plan. I want to separate contracts from execution and move towards a schema-first architecture. Do not change any files yet."

- "Summarise the plan with: mandatory steps vs optional future steps."

**Expected outcome**: A clear, ordered list of steps with files to touch, risks, and completion criteria.

**Note**: The agent should not touch files or git yet—this is planning only.

### Step 3 – Execute a small step

Example phrases:

- "Take the first small step from the plan and execute it using `skill.code_exec_task_basic`. Create a dedicated git branch if needed and run the build."

- "After you're done, show me which files you changed and the build result."

**You remain in control**: You decide which step to run, when to commit, and when to ask for the next step.

## 4. Creating a new skill for this project

When you see a recurring pattern (e.g., "analyze contracts", "generate API client", "validate schema"), you can turn it into a MOVA skill. This makes it reusable, testable, and shareable.

Example phrases:

- "Create a new skill for this project using `skill.skill_scaffolder_basic`. It should produce a structured snapshot of our contracts layer (schemas and envelopes)."

- "Show me the manifest, schemas and example case that were generated. Do not run git commands yet."

**Where the agent will place the new skill**:

- Under `mova_skills_lab/skills/<your_skill>/`
- Registered in `lab/skills_registry_v1.json`

The agent will generate: manifest, input/output schemas (ds.*), envelope (env.*), prompt profile (if LLM-only), runtime binding, example case, and documentation.

## 5. Adding a connector to an external service

Connectors describe external APIs (HTTP, cloud services, databases) as MOVA contracts. This makes them reusable and testable.

Example phrases:

- "Use `skill.connector_scaffolder_basic` to create a connector for my Cloudflare Worker health endpoint `/health`."

- "Base URL should be a template (like `${MY_WORKER_BASE_URL}`), no secrets, no auth."

**Expected results**: A connector manifest, ds/env schemas describing the API contract, HTTP binding configuration, and a sample case with example payloads.

## 6. Generating client code

Two common scenarios:

### Client for a skill

- "Generate a TypeScript client using `skill.runtime_binding_code_scaffolder_basic` for the skill we just created. It should export a single function that I can call from my React app."

### Client for a connector

- "Generate a browser-friendly TypeScript client for the connector that calls the `/health` endpoint with `fetch` and returns a typed result."

**What the agent will do**:

- Create a file like `src/mova/<Something>Client.ts`
- Generate typed functions based on the skill/connector schemas
- Ensure it compiles (run the build if you approve)

## 7. Safety checklist for users

- Always ask the agent to **explain the plan** before executing large changes.
- Prefer running one small step at a time via `skill.code_exec_task_basic`.
- Allow git operations (branch/commit) explicitly and keep experiment branches separate.
- If something feels unclear, ask the agent to show the exact ds.* request it is going to send to a skill.
- Review generated code before committing—especially for connectors and runtime bindings.

## 8. Where to go next

- Read `IDE_AGENT_PROTOCOL_v1.md` for full details on the agent workflow.
- Browse `lab/skills_registry_v1.json` to see which skills and connectors are available.
- Consider adding your own project-specific skills and connectors when patterns stabilise.
- Check `docs/EPISODE_*.md` for real-world examples of using MOVA Skills Lab in projects.

