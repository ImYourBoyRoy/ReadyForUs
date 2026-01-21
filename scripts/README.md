# Scripts Documentation - Ready for Us PWA

> **AI Mode**: This README is optimized for AI assistants managing questionnaire phases. Follow workflows exactly for optimal results.

This directory contains production-ready agentic tools for managing the Ready for Us questionnaire system with **99.5% token reduction** vs manual editing. All tools follow ROY-STANDARD practices with surgical precision, automatic backups, and schema validation.

---

## 🎯 AI Quick Start: Creating a New Phase

**Token Budget**: ~200 tokens total | **Time**: <2 minutes

```bash
# Step 1: Create phase structure (~50 tokens)
python scripts/phase_scaffold.py create --id phase_X --title "Phase Title"

# Step 2: Add sections (~50 tokens)
python scripts/section_manager.py add --phase phase_X --id s1 --title "Section 1 Title"
python scripts/section_manager.py add --phase phase_X --id s2 --title "Section 2 Title"

# Step 3: Add simple questions via CLI (~50 tokens each)
python scripts/question_tool.py add --phase phase_X --section s1 --title "Question" --prompt "Prompt text" --type single_select --options "opt1:Label 1,opt2:Label 2" --manifest lite,full

# Step 4: Add complex compound questions via JSON import (~800 tokens)
# Create data/phase_X/questions/q##.json with full structure
python scripts/question_tool.py import --phase phase_X --file q##.json

# Step 5: Validate (~10 tokens each)
python scripts/validate_schema.py --phase phase_X
python scripts/validate_manifest.py --phase phase_X
python scripts/validate_prompts.py --phase phase_X
```

**Result**: Production-ready phase with full SCHEMA compliance.

---

## 🚀 Agentic Tools (AI-Optimized)

### section_manager.py - Section CRUD Operations

**Purpose**: Surgical section management without loading entire questions.json  
**Token Cost**: ~50 tokens per operation  
**Backup**: Automatic `.bak` files

**Commands**:

```bash
# Add section (auto-position or explicit)
python scripts/section_manager.py add --phase PHASE --id SECTION_ID --title "Title" [--order POSITION]

# Remove section (prevents orphan questions)
python scripts/section_manager.py remove --phase PHASE --id SECTION_ID --confirm

# Rename section
python scripts/section_manager.py rename --phase PHASE --id SECTION_ID --title "New Title"

# Reorder section
python scripts/section_manager.py reorder --phase PHASE --id SECTION_ID --position POSITION

# List all sections
python scripts/section_manager.py list --phase PHASE [--format text|json]
```

**AI Best Practice**: Always add sections before adding questions. Verify with `list` command.

---

### question_tool.py - Question CRUD + Import

**Purpose**: Surgical question operations supporting full SCHEMA.md compliance  
**Token Cost**: ~50 tokens (simple) | ~800 tokens (compound import)  
**Backup**: Automatic `.bak` files

#### Add Simple Questions (CLI)

```bash
# Free text question
python scripts/question_tool.py add \
  --phase PHASE \
  --section SECTION_ID \
  --title "Question title" \
  --prompt "Question prompt text" \
  --type free_text \
  --manifest lite,full \
  --examples "Example 1,Example 2"

# Single select question
python scripts/question_tool.py add \
  --phase PHASE \
  --section SECTION_ID \
  --title "Question title" \
  --prompt "Choose one" \
  --type single_select \
  --options "value1:Label 1,value2:Label 2,other:Other (write in)" \
  --manifest lite,full \
  --examples "Label 1"

# Multi select question
python scripts/question_tool.py add \
  --phase PHASE \
  --section SECTION_ID \
  --title "Question title" \
  --prompt "Select all that apply" \
  --type multi_select \
  --options "opt1:Option 1,opt2:Option 2" \
  --manifest full \
  --examples "Option 1 + Option 2"
```

#### Import Compound Questions (JSON)

**AI Workflow for Compound Questions**:

1. **Create JSON template** in `data/PHASE/questions/q##.json`:

```json
{
    "id": "q##",
    "section_id": "s#",
    "order": ##,
    "title": "Question Title",
    "prompt": "Question prompt text",
    "type": "compound",
    "fields": [
        {
            "key": "field_name",
            "label": "Field label",
            "type": "single_select|multi_select|ranked_select|short_text|free_text|number",
            "options": [{"value": "val", "label": "Label"}],
            "placeholder": "Optional placeholder",
            "showWhen": {
                "field": "other_field",
                "equals": "value"
            }
        }
    ],
    "answer_schema": {
        "field_name": "",
        "other_field": []
    },
    "validation": {
        "required_if": [
            {
                "if": {"field": "field_name", "equals": "value"},
                "then_require": ["other_field"]
            }
        ]
    },
    "examples": ["Example answer"],
    "tags": {
        "included_in_manifests": ["lite", "full"]
    }
}
```

1. **Import the question**:

```bash
python scripts/question_tool.py import --phase PHASE --file q##.json
```

**Supported Field Types**:

- `single_select` - Radio buttons (requires `options`)
- `multi_select` - Checkboxes (requires `options`)
- `ranked_select` - Drag-to-rank selection (requires `options`)
- `short_text` - Single-line text input
- `free_text` - Multi-line textarea
- `number` - Numeric input (supports `min`, `max`)

**Conditional Display** (`showWhen`):

- `equals` - Field equals specific value
- `notEquals` - Field does not equal value
- `in` - Field value in array
- `includes` - Array field includes value

#### Other question_tool.py Commands

```bash
# Update question field
python scripts/question_tool.py update --phase PHASE --question QID --field FIELD --value VALUE

# Delete question
python scripts/question_tool.py delete --phase PHASE --question QID --confirm

# Get question details
python scripts/question_tool.py get --phase PHASE --question QID [--format text|json]
```

---

### validate_schema.py - Questions.json Validation

**Purpose**: Comprehensive validation against SCHEMA.md  
**Token Cost**: ~10 tokens  
**Checks**: Structure, types (including ranked_select), references, manifests, options, fields, duplicates, orphans, best_practices

```bash
# Validate single phase
python scripts/validate_schema.py --phase PHASE

# Validate all phases
python scripts/validate_schema.py

# Strict mode (warnings = errors)
python scripts/validate_schema.py --phase PHASE --strict

# Specific checks only
python scripts/validate_schema.py --phase PHASE --check structure,types,references

# JSON output
python scripts/validate_schema.py --phase PHASE --format json
```

**New in this version**:

- ✅ Support for `ranked_select` question type
- ✅ Best practices check warns about multi-select without max limits

**AI Best Practice**: Run after every question import or batch of additions. Fix errors before proceeding.

---

### validate_manifest.py - Manifest.json Validation

**Purpose**: Validate manifest structure and required fields  
**Token Cost**: ~10 tokens  
**Prevents**: Web app crashes from missing fields

```bash
# Validate manifest
python scripts/validate_manifest.py --phase PHASE

# JSON output
python scripts/validate_manifest.py --phase PHASE --format json
```

**AI Best Practice**: Run immediately after creating/updating manifest.json.

---

### validate_prompts.py - Prompts.json Validation

**Purpose**: Validate prompts structure and required fields  
**Token Cost**: ~10 tokens  
**Prevents**: Missing or malformed AI prompts

```bash
# Validate prompts for a specific phase
python scripts/validate_prompts.py --phase PHASE

# Validate all phases
python scripts/validate_prompts.py

# JSON output
python scripts/validate_prompts.py --phase PHASE --format json

# Strict mode (warnings = errors)
python scripts/validate_prompts.py --phase PHASE --strict
```

**Checks**:

- Presence of all four required prompts (individual_reflection_lite, individual_reflection_full, couple_reflection_lite, couple_reflection_full)
- Required fields: id, title, description, role, inputs, context, output_format, constraints
- Proper structure for inputs, output_format sections, and constraints
- Placeholder text warnings (REPLACE:, TODO:, FIXME:)

**AI Best Practice**: Run immediately after creating/updating prompts.json.

---

### question_properties.py - Bulk Property Management

**Purpose**: Manage structural properties (max, min) across multiple questions  
**Token Cost**: ~20 tokens  
**Prevents**: Analysis paralysis from unlimited multi-select questions

```bash
# List properties for multi-select questions
python scripts/question_properties.py list-props --phase PHASE --type multi_select

# Set max on specific questions
python scripts/question_properties.py set-max --phase PHASE --questions q06,q18,q22 --value 7

# Set max on ALL multi-select questions
python scripts/question_properties.py set-max --phase PHASE --type multi_select --value 5

# Set min limit
python scripts/question_properties.py set-min --phase PHASE --questions q04 --value 3

# Remove max limit
python scripts/question_properties.py remove-max --phase PHASE --questions q06
```

**Use Cases**:

- Add max limits to multi-select questions to prevent analysis paralysis
- Set min limits on ranked or multi-select questions
- Bulk update properties across all questions of a type
- Audit current property settings

**AI Best Practice**: Run after creating multi-select questions. Use `list-props` to audit before deployment.

---

### phase_scaffold.py - Phase Structure Generator

**Purpose**: Bootstrap new phase directory with template files  
**Token Cost**: ~50 tokens  
**Creates**: `manifest.json`, `questions.json`, `prompts.json`, `questions/` directory

```bash
# Create new phase
python scripts/phase_scaffold.py create --id PHASE_ID --title "Phase Title"

# Template from existing phase
python scripts/phase_scaffold.py create --id PHASE_ID --title "Title" --template phase_0

# Dry run
python scripts/phase_scaffold.py create --id PHASE_ID --title "Title" --dry-run
```

**AI Best Practice**:

- Use scaffold to create structure ONLY
- Manually create high-quality `manifest.json` (~600 tokens)
- Manually create high-quality `prompts.json` (~4,000 tokens)
- Use `section_manager.py` and `question_tool.py` for questions

---

### question_search.py - Efficient Question Queries

**Purpose**: Search/filter questions without loading full files  
**Token Cost**: ~30 tokens  
**Use Case**: Find questions by type, section, text, missing fields

```bash
# Search all phases for text
python scripts/question_search.py --text "relationship"

# Find questions by type in phase
python scripts/question_search.py --phase PHASE --type compound

# Find questions in specific section
python scripts/question_search.py --phase PHASE --section s1

# Find questions in manifest
python scripts/question_search.py --phase PHASE --manifest full

# Find questions missing examples
python scripts/question_search.py --missing examples

# Count only (no details)
python scripts/question_search.py --phase PHASE --count
```

---

## 📋 Legacy Tools (Export/Merge Workflow)

### questions_manager.py

**Purpose**: Export/merge workflow for bulk editing  
**Use Case**: When you need to edit many questions at once in individual files

```bash
# Export all phases to individual JSON files
python scripts/questions_manager.py --action export

# Export specific phase
python scripts/questions_manager.py --action export --phase PHASE

# Merge edited questions back (creates backup)
python scripts/questions_manager.py --action merge --phase PHASE
```

**AI Best Practice**: Prefer `question_tool.py` for surgical edits. Use export/merge only for bulk operations.

---

### audit_questions.py

**Purpose**: Quality analysis and reporting  
**Token Cost**: Varies by scope  
**Use Case**: Pre-deployment quality checks

```bash
# Audit all phases
python scripts/audit_questions.py

# Audit specific phase with markdown output
python scripts/audit_questions.py --phase PHASE --format markdown --output audit.md

# Run specific checks
python scripts/audit_questions.py --check missing_examples,validation
```

**Checks**:

- `missing_examples` - Questions without examples
- `validation` - Validation coverage
- `multi_select_limits` - Multi-select without max limits
- `ranking_candidates` - Should use ranked_select
- `long_prompts` - Prompts >200 chars
- `options_review` - Options structure review
- `compound_fields` - Compound field analysis

---

## 🎨 AI Workflows: Best Practices

### Workflow 1: Creating a Production Phase (48 Questions)

**Goal**: Create phase_X with 48 questions across 4 sections  
**Total Tokens**: ~5,000 | **Manual Tokens**: ~1,056,000 | **Savings**: 99.5%

```bash
# 1. Create structure (~50 tokens)
python scripts/phase_scaffold.py create --id phase_X --title "Phase Title"

# 2. Create production-quality manifest.json manually (~600 tokens)
#    Use TEMPLATE_manifest.json as guide
#    Customize: display, artifact, intro, privacy_preface

# 3. Create production-quality prompts.json manually (~4,000 tokens)
#    Use TEMPLATE_prompts.json as guide
#    Customize all 4 prompts: individual/couple × lite/full

# 4. Add sections (~200 tokens)
python scripts/section_manager.py add --phase phase_X --id s1 --title "Section 1"
python scripts/section_manager.py add --phase phase_X --id s2 --title "Section 2"
python scripts/section_manager.py add --phase phase_X --id s3 --title "Section 3"
python scripts/section_manager.py add --phase phase_X --id s4 --title "Section 4"

# 5. Add 30 simple questions via CLI (~1,500 tokens)
#    Use question_tool.py add for single_select, multi_select, free_text

# 6. Add 18 compound questions via JSON import (~14,400 tokens)
#    Create q##.json files with full structure
#    Use question_tool.py import for each

# 7. Validate EVERYTHING (~40 tokens)
python scripts/validate_manifest.py --phase phase_X
python scripts/validate_prompts.py --phase phase_X
python scripts/validate_schema.py --phase phase_X
python scripts/audit_questions.py --phase phase_X --format markdown --output phase_X_audit.md

# 8. Review audit report and fix any issues
```

**Critical Success Factors**:

1. **Manifest first**: Create high-quality manifest.json before questions
2. **Prompts next**: Create all 4 AI prompts with phase-specific content
3. **Sections early**: Add all sections before any questions
4. **Simple CLI, Complex JSON**: Use CLI for simple types, JSON import for compound
5. **Validate often**: After every major milestone
6. **Iterate on audit**: Fix issues, re-validate, repeat

---

### Workflow 2: Adding Questions to Existing Phase

**Goal**: Add 5 new questions to existing phase  
**Total Tokens**: ~250

```bash
# 1. List existing sections
python scripts/section_manager.py list --phase PHASE

# 2. Add questions to appropriate sections
python scripts/question_tool.py add --phase PHASE --section s1 --title "..." --type single_select --options "..." --manifest lite,full

# 3. For compound questions, create JSON then import
#    Create q##.json
python scripts/question_tool.py import --phase PHASE --file q##.json

# 4. Validate
python scripts/validate_schema.py --phase PHASE
```

---

### Workflow 3: Fixing Validation Errors

**Goal**: Respond to validation errors efficiently

```bash
# 1. Run validation
python scripts/validate_schema.py --phase PHASE

# 2. For each error:
#    - Missing field: Use question_tool.py update
#    - Wrong type: Use question_tool.py update
#    - Orphan question: Add to section via section_manager.py or delete
#    - Duplicate ID: Use question_tool.py delete + re-add

# 3. Re-validate
python scripts/validate_schema.py --phase PHASE
```

---

## 📐 Schema Compliance Checklist

All AI-generated files MUST meet these requirements:

### manifest.json

✅ **Required Fields**:

- `display` (id, title, short_title, description, icon, menu_icon, order)
- `artifact` (id, stage.eligibility, stage.readiness, purpose, deliverables, decision_aid, archetype_integration)
- `intro` (title, instructions, items, keep_in_mind)
- `prompts_artifact` (id, filename)
- `privacy_preface` (sensitive_topics, use_guidelines, note_taking)

✅ **Best Practices**:

- `display.title` includes phase prefix (e.g., "Phase 0: ...")
- `display.short_title` is concise (e.g., "Starting Point")
- `artifact.id` has descriptive suffix (e.g., "starting_point_snapshot")
- All text is phase-specific, NOT generic placeholders
- `intro.instructions` are contextual and actionable
- `privacy_preface` addresses actual phase concerns

### questions.json

✅ **Required Top-Level Fields**:

- `sections` - Array of section objects
- `questions` - Object keyed by question ID
- `ui_hints` - Mode switcher configuration
- `manifests` - Lite and full mode definitions
- `primary_manifest_id` - Default mode

✅ **Question Requirements**:

- Sequential IDs: `q01`, `q02`, `q03` (NOT `q1`, `q2`)
- Sequential orders: 1, 2, 3, 4 (unique within phase)
- All questions have: `id`, `section_id`, `order`, `title`, `prompt`, `type`, `answer_schema`, `examples`, `tags`
- Select types have `options` array with `value` and `label`
- Compound types have `fields` array with proper structure
- All questions referenced in sections and manifests

✅ **Conditional Logic**:

- `showWhen` uses valid operators: `equals`, `notEquals`, `in`, `includes`
- `validation.required_if` references existing fields
- Field dependencies are logical and testable

### prompts.json

✅ **Required Prompts**:

- `individual_reflection_lite`
- `individual_reflection_full`
- `couple_reflection_lite`
- `couple_reflection_full`

✅ **Each Prompt Requires**:

- `id`, `title`, `description`, `role`, `inputs`, `context`, `output_format`, `constraints`
- `outputs` array with sections and requirements
- Phase-specific content (NOT template placeholders)

---

## 🔧 Utility Tools

### bump_version.py

**Purpose**: Update app version for cache busting  
**Files Updated**: `index.html`, `sw.js`, all JS modules

```bash
python scripts/bump_version.py 2.5.0
```

### extract_questions.py

**Purpose**: Read-only formatted display of questions

```bash
python scripts/extract_questions.py PHASE
```

### convert_questions_md.py

**Purpose**: Export questions to Markdown format

```bash
python scripts/convert_questions_md.py
```

---

## ⚠️ Common AI Pitfalls to Avoid

### ❌ DON'T: Try to edit 50,000-token questions.json manually

✅ **DO**: Use `question_tool.py` for surgical operations

### ❌ DON'T: Generate manifest.json with generic placeholder text

✅ **DO**: Create phase-specific, contextual content for every field

### ❌ DON'T: Use complex CLI arguments for compound questions

✅ **DO**: Create JSON template files and use `import` command

### ❌ DON'T: Skip validation between operations

✅ **DO**: Validate after every import/add/update batch

### ❌ DON'T: Create questions before sections

✅ **DO**: Always create sections first with `section_manager.py`

### ❌ DON'T: Use inconsistent question IDs (q1, q02, q003)

✅ **DO**: Always use zero-padded format (q01, q02, q03)

### ❌ DON'T: Forget to assign questions to manifests

✅ **DO**: Explicitly set `--manifest lite,full` or customize

### ❌ DON'T: Create circular `showWhen` dependencies

✅ **DO**: Ensure field dependencies are acyclic

---

## 📊 Token Efficiency Reference

| Operation | Manual (tokens) | Tool (tokens) | Reduction |
|-----------|----------------|--------------|-----------|
| Create phase structure | 5,000 | 50 | 99.0% |
| Add section | 22,000 | 50 | 99.8% |
| Add simple question | 22,000 | 50 | 99.8% |
| Add compound question | 22,000 | 800 | 96.4% |
| Validate schema | 2,000 | 10 | 99.5% |
| Search questions | 22,000 | 30 | 99.9% |
| **48-question phase** | **1,056,000** | **5,000** | **99.5%** |

---

## 📚 Reference Documents

- [`data/SCHEMA.md`](../data/SCHEMA.md) - Complete schema specification
- [`data/TEMPLATE_manifest.json`](../data/TEMPLATE_manifest.json) - Manifest template
- [`data/TEMPLATE_questions.json`](../data/TEMPLATE_questions.json) - Questions template
- [`data/TEMPLATE_prompts.json`](../data/TEMPLATE_prompts.json) - Prompts template

---

## 🤖 For AI Assistants: Critical Reminders

1. **NEVER load entire questions.json to make small changes** - Use surgical tools
2. **ALWAYS validate after each operation** - Catch errors early
3. **CREATE sections BEFORE questions** - Questions require valid section_id
4. **USE JSON import for compound questions** - CLI is for simple types only
5. **GENERATE phase-specific content** - No placeholder text in production files
6. **FOLLOW exact ID format** - q01, q02, NOT q1, q2
7. **BACKUP automatically created** - All tools create .bak files before changes
8. **VERIFY manifest completeness** - Use validate_manifest.py
9. **VERIFY prompts completeness** - Use validate_prompts.py
10. **CHECK audit report** - Fix issues before deployment
11. **MEASURE token usage** - Confirm 99%+ reduction vs manual

---

## Development Guidelines

### ROY-STANDARD Requirements

All scripts in this folder follow these standards:

1. **File Path Comment**: First or second line (after shebang)
2. **Header Docstring**: Complete usage documentation
3. **Dynamic Behavior**: Auto-detect environment, no hardcoded paths
4. **CLI-First Design**: Proper argparse with help text
5. **Error Handling**: Clear messages, proper exit codes
6. **Testing**: Easily testable, example usage in docstring

---

## Author

**Created by**: Roy Dawson IV  
**Email**: <Roy.Dawson.IV@gmail.com>  
**GitHub**: [https://github.com/imyourboyroy](https://github.com/imyourboyroy)  
**PyPI**: [https://pypi.org/user/ImYourBoyRoy/](https://pypi.org/user/ImYourBoyRoy/)

---

*Last Updated*: January 2026  
*Scripts Version*: 3.0 (Agentic Tools)  
*Token Efficiency*: 99.5% reduction vs manual editing
