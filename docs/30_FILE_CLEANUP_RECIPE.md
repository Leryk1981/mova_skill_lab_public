# File Cleanup Recipe

## What this recipe does

This is a **manual recipe** for using `skill.file_cleanup_basic` to plan cleanup of a **single local disk or partition**.

The workflow is simple:
1. Collect a disk snapshot (folder structure with sizes)
2. Fill in a JSON request template
3. Run the skill to get a cleanup plan
4. Execute the plan manually (the skill never deletes files itself)

This recipe does **not** use connectors or automatic tools. It's a step-by-step guide for manual disk cleanup planning.

---

## Prerequisites

You need:

- **A tool that shows disk structure and folder sizes**. Examples:
  - `tree` (command-line, with size options)
  - PowerShell `Get-ChildItem` with size calculations
  - WinDirStat (Windows GUI)
  - TreeSize Free (Windows GUI)
  - `du` (Linux/macOS command-line)
  - Any file manager with size display

- **A text editor** to fill in the JSON request

- **Access to an environment** where you can run `env.file_cleanup_run_v1` (IDE/LLM agent that supports MOVA skills)

You don't need deep knowledge of these tools – just pick one that can show you folder sizes and structure.

---

## Step 1 — Collect a disk snapshot

### 1.1. Choose your disk

Pick a single disk or partition to analyze (e.g., `D:`, `C:`, `/home`).

### 1.2. Get overall metrics

Collect the following information:
- **Total size** (in GB)
- **Used space** (in GB)
- **Free space** (in GB)

You can get this from:
- Windows: File Explorer properties, or PowerShell: `Get-PSDrive D | Select-Object Used,Free`
- Linux/macOS: `df -h`

Write these down (you'll need them for the JSON).

### 1.3. Get folder structure with sizes

Create a text dump of your disk structure. Include:
- **Top-level folders with sizes** (e.g., `D:\Downloads (~220 GB)`, `D:\Projects (~300 GB)`)
- **Optional: Largest folders** (top 10-20 by size)
- **Optional: File type statistics** (if your tool provides this: video, images, archives, etc.)

**Examples of how to collect this:**

**PowerShell (Windows):**
```powershell
Get-ChildItem D:\ -Directory | Select-Object Name, @{Name="Size(GB)";Expression={[math]::Round((Get-ChildItem $_.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB, 2)}} | Format-Table
```

**TreeSize Free (Windows GUI):**
- Open TreeSize Free
- Select your drive
- Export the tree view as text

**du (Linux/macOS):**
```bash
du -h --max-depth=1 /home | sort -hr | head -20
```

**Important**: You don't need perfect accuracy. The goal is to give the skill enough context to generate a reasonable plan. Approximate sizes are fine.

### 1.4. Save your snapshot

Keep this information in a plain text file or note. You'll copy it into the JSON template in Step 3.

---

## Step 2 — Describe your preferences

Before filling the JSON, think about your cleanup goals:

### 2.1. Target free space

How much space do you want to free up? (in GB)

Example: "I want to free up 100 GB" → `target_free_space_gb: 100`

### 2.2. Protected paths

What must **never** be deleted? List paths or patterns:
- Project folders: `D:\Projects`, `D:\Work`
- Personal files: `D:\Photos`, `D:\Documents`
- System folders: `C:\Windows`, `C:\Program Files`

Example: `must_not_delete: ["Projects", "Photos", "Documents"]`

### 2.3. Risk tolerance

Choose your risk level:
- **`conservative`**: Only obvious junk (cache, temp files, known safe deletions)
- **`moderate`**: Some optional deletions that need review
- **`aggressive`**: More aggressive cleanup (use with caution)

### 2.4. Special preferences

Any additional notes:
- "I hate the Downloads folder but I'm afraid to break something"
- "Old video archives can be compressed or moved to external drive"
- "Game caches are fine to delete"

Write these down – they'll go into the `notes` field.

---

## Step 3 — Fill `ds.file_cleanup_request_v1`

Open the template file:
- `skills/file_cleanup_basic/cases/file_cleanup_request_template_manual_v1.json`

### 3.1. Required fields

**`disk_label`** (required):
- Your disk identifier: `"D:"`, `"C:"`, `"/home"`, etc.

**`disk_snapshot`** (required):
- Paste the text dump you collected in Step 1.3
- This is just plain text – no special formatting needed
- Example:
  ```
  D:\Downloads (~220 GB)
  D:\Temp (~15 GB)
  D:\Projects (~300 GB)
  D:\Photos (~180 GB)
  ```

### 3.2. Optional but recommended fields

**`disk_metrics`** (optional but helpful):
```json
"disk_metrics": {
  "total_size_gb": 930,
  "used_size_gb": 850,
  "free_size_gb": 80
}
```

**`user_preferences`** (optional but recommended):
```json
"user_preferences": {
  "target_free_space_gb": 100,
  "must_not_delete": ["Projects", "Photos"],
  "risk_tolerance": "conservative",
  "known_junk_areas": ["Temp", "Cache", "*.tmp"]
}
```

**`notes`** (optional):
- Any special preferences from Step 2.4

### 3.3. Example (simplified)

```json
{
  "disk_label": "D:",
  "disk_metrics": {
    "total_size_gb": 500,
    "used_size_gb": 450,
    "free_size_gb": 50
  },
  "disk_snapshot": "D:\\Downloads (~45 GB)\nD:\\Temp (~12 GB)\nD:\\Projects (~180 GB)\nD:\\Photos (~120 GB)",
  "user_preferences": {
    "target_free_space_gb": 100,
    "must_not_delete": ["Projects", "Photos"],
    "risk_tolerance": "moderate"
  },
  "notes": "Focus on Downloads and Temp. Don't touch Projects or Photos."
}
```

See the full template file for a complete example with all fields.

---

## Step 4 — Run `skill.file_cleanup_basic`

### 4.1. Wrap the request in an envelope

The request needs to be wrapped in `env.file_cleanup_run_v1`. In most environments (IDE/LLM agent), this is done automatically when you "run the skill" with your JSON.

The envelope structure:
```json
{
  "envelope_id": "env.file_cleanup_run_v1",
  "verb": "transform",
  "resource": "note",
  "input": {
    // Your ds.file_cleanup_request_v1 here
  }
}
```

### 4.2. Execute the skill

Run the skill through your environment (IDE agent, MOVA runtime, etc.). The skill will return a `ds.file_cleanup_result_v1` with:

- **`overview_md`**: Human-readable markdown overview of the current disk state and cleanup goals
- **`actions[]`**: Structured list of recommended actions, grouped by category:
  - `safe_deletion`: Almost certainly safe junk
  - `optional_deletion`: May be safe but needs review
  - `archive`: Should be archived
  - `move`: Should be moved
  - `inspect_manually`: Needs human inspection
- **`checklist_md`**: Step-by-step markdown checklist for safe execution
- **`summary`**: Aggregated summary (total estimated space, action counts, risk categories)

### 4.3. Important notes

- The skill **never deletes files itself**
- It only proposes a plan: what to delete, what to move, what to inspect manually
- All actions are recommendations – you decide what to execute

---

## Step 5 — Execute the plan (carefully)

### 5.1. Review the plan

Read through:
- `overview_md` to understand the current state and goals
- `actions[]` to see all recommended actions with risk levels
- `checklist_md` for step-by-step execution

### 5.2. Use the checklist

Follow `checklist_md` as your action plan:
- Check off completed steps
- Verify that nothing "protected" is being touched
- If something looks risky, skip it or investigate further

### 5.3. Be cautious

Treat recommendations as **advice**, not commands:
- If something looks risky, don't do it
- You can roll back or ignore any item
- When in doubt, mark it for manual inspection

### 5.4. Verify results

After executing actions:
- Check that free space increased as expected
- Verify that no important files were affected
- Test that applications still work correctly

---

## Summary

This recipe gives you a manual workflow for using `skill.file_cleanup_basic`:

1. **Collect snapshot**: Get disk structure and sizes using any tool
2. **Set preferences**: Define what you want to achieve and what to protect
3. **Fill JSON**: Use the template to create a valid request
4. **Run skill**: Get a structured cleanup plan
5. **Execute carefully**: Follow the checklist, but use your judgment

The skill is a **planning tool**, not an executor. You remain in control of all file operations.

