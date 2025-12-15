# Call-Envelope Primitive

This document describes the **call-envelope** primitive, a foundational building block in MOVA Skills Lab for invoking other envelopes.

---

## What is Call-Envelope

A call-envelope is a **second-order speech act** in MOVA: it describes "invoke another envelope" rather than performing a direct action.

### Regular vs Call-Envelope

**Regular envelope** (first-order):
- `env.repo_snapshot_run_v1` directly transforms repository data into a snapshot
- Performs a concrete action (transform, create, update, etc.)

**Call-envelope** (second-order):
- `env.call_run_v1` invokes another envelope (e.g., `env.repo_snapshot_run_v1`) with provided data
- Performs a meta-action: "call this other envelope"

---

## Schema Structure

### `ds.call_request_v1`

Request to invoke another envelope:

```json
{
  "target_envelope_id": "env.repo_snapshot_run_v1",
  "target_envelope_version": "v1",
  "data": {
    "repo_name": "my_project",
    "raw_repo_tree": "...",
    "raw_readme": "..."
  },
  "call_context": {
    "trace_id": "trace_123",
    "correlation_id": "corr_456"
  }
}
```

**Fields:**
- `target_envelope_id` (required): Full identifier of the envelope to invoke
- `target_envelope_version` (optional): Version/variant for disambiguation
- `data` (required): Payload for the target envelope (matches target's input structure)
- `call_context` (optional): Service fields (trace id, correlation id, priority, etc.)

### `ds.call_result_v1`

Result of invoking the target envelope:

```json
{
  "target_envelope_id": "env.repo_snapshot_run_v1",
  "status": "success",
  "output": {
    "project_snapshot_md": "...",
    "global_memory_md": "...",
    "checklist_for_human": "..."
  }
}
```

Or on error:

```json
{
  "target_envelope_id": "env.repo_snapshot_run_v1",
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: repo_name",
    "details": {
      "field": "repo_name",
      "schema_path": "/properties/repo_name"
    }
  }
}
```

**Fields:**
- `target_envelope_id` (required): Echo from request
- `status` (required): `"success"` or `"error"`
- `output` (optional): If success, contains target envelope's output
- `error` (optional): If error, contains structured error information

### `env.call_run_v1`

The envelope wrapper:

```json
{
  "envelope_id": "env.call_run_v1",
  "verb": "call",
  "resource": "envelope",
  "input": {
    // ds.call_request_v1
  },
  "output": {
    // ds.call_result_v1
  }
}
```

---

## Use Cases

### 1. Meta-Skills

A meta-skill can propose a plan that involves calling multiple other envelopes:

```json
{
  "envelope_id": "env.skill_scaffold_run_v1",
  "input": {
    "new_skill_id": "skill.my_new_skill",
    // ... scaffold request
  }
}
```

The scaffolder might internally use call-envelopes to:
- First call `env.context7_docs_fetch_v1` to get API docs
- Then generate the scaffold based on the docs

(Note: Current implementation doesn't do this, but call-envelope enables it.)

### 2. Scenarios/Recipes

A scenario can chain multiple skill calls:

```json
[
  {
    "envelope_id": "env.call_run_v1",
    "input": {
      "target_envelope_id": "env.context7_docs_fetch_v1",
      "data": { /* ... */ }
    }
  },
  {
    "envelope_id": "env.call_run_v1",
    "input": {
      "target_envelope_id": "env.skill_scaffold_run_v1",
      "data": { /* ... */ }
    }
  }
]
```

### 3. Orchestration Layers

An orchestration layer can use call-envelopes to:
- Execute skill sequences
- Handle errors and retries
- Manage dependencies between skills

---

## Important Notes

### Red-Zone Primitive

Call-envelope is a **red-zone primitive**: it belongs to `core/mova/`, not to any specific skill. It's part of the foundational MOVA vocabulary.

### No Orchestration Logic

Call-envelope does **not** include:
- Sequencing logic (do A, then B)
- Conditionals (if X, then Y)
- Loops (repeat N times)
- Error handling strategies

These belong to a **separate orchestration layer** that uses call-envelopes as building blocks.

### Foundation, Not Framework

Call-envelope provides the **foundation** for building scenarios, but:
- Scenarios themselves are defined at a higher level
- Orchestration logic lives in recipes/orchestrators
- Call-envelope is just the primitive: "invoke this envelope"

---

## Example: Chaining Skills

Here's a conceptual example of how call-envelopes enable chaining:

```json
{
  "envelope_id": "env.call_run_v1",
  "input": {
    "target_envelope_id": "env.context7_docs_fetch_v1",
    "data": {
      "request_id": "req_001",
      "library": "ajv"
    }
  }
}
```

Result:

```json
{
  "target_envelope_id": "env.context7_docs_fetch_v1",
  "status": "success",
  "output": {
    "bundle_id": "bundle_001",
    "items": [ /* ... */ ]
  }
}
```

Then use that result in another call:

```json
{
  "envelope_id": "env.call_run_v1",
  "input": {
    "target_envelope_id": "env.skill_scaffold_run_v1",
    "data": {
      "new_skill_id": "skill.ajv_validator",
      "skill_kind": "connector",
      "input_brief": "/* summary from context7_docs result */",
      // ...
    }
  }
}
```

---

## Summary

Call-envelope (`env.call_run_v1`) is a minimal primitive that enables:
- Invoking other envelopes programmatically
- Building scenarios that chain skill calls
- Creating meta-skills that coordinate multiple skills

It's a **foundation**, not a framework: orchestration logic lives above it, but it provides the building blocks for scenarios.

