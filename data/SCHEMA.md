# Questionnaire Schema Documentation

## For AI Models & Human Authors

Use this reference to create new `questions.json` and `prompts.json` files for any phase.

---

## questions.json Structure

```json
{
  "schema_version": "1.3.0",
  "artifact": { /* Phase metadata */ },
  "intro": { /* Instructions and guidance */ },
  "sections": [ /* Question groupings */ ],
  "questions": { /* All questions by ID */ },
  "ui_hints": { /* Optional UI configuration */ },
  "manifests": { /* Mode definitions (lite/full) */ },
  "primary_manifest_id": "lite"
}
```

---

## Top-Level Fields

### artifact (required)

```json
{
  "id": "unique_phase_id",
  "title": "Display Title",
  "subtitle": "Phase description shown on welcome screen",
  "language": "en-US",
  "stage": {
    "code": "phase_code",
    "label": "Human-readable stage label",
    "eligibility": ["Who should use this phase", "Criteria 2"]
  },
  "purpose": ["Goal 1", "Goal 2", "Goal 3"]
}
```

### intro (required)

```json
{
  "instructions": {
    "title": "Instructions",
    "items": ["Instruction 1", "Instruction 2"]
  },
  "keep_in_mind": {
    "title": "Keep in Mind",
    "items": ["Reminder 1", "Reminder 2"]
  }
}
```

### sections (required)

```json
[
  {
    "id": "s1",
    "title": "Section Title",
    "question_ids": ["q01", "q02", "q03"]
  }
]
```

### manifests (required)

```json
{
  "lite": {
    "id": "lite",
    "title": "Lite",
    "question_ids": ["q01", "q02", "..."],
    "timebox_minutes": 45,
    "post_timebox_activity": "What to do after the timebox ends"
  },
  "full": {
    "id": "full",
    "title": "Full",
    "question_ids": ["q01", "q02", "...", "q38"],
    "timebox_minutes": 90,
    "post_timebox_activity": "What to do after the timebox ends"
  }
}
```

---

## Question Types

### 1. free_text

Simple open-ended text response.

```json
{
  "id": "q01",
  "section_id": "s1",
  "order": 1,
  "title": "Question title",
  "prompt": "The question text shown to user",
  "type": "free_text",
  "answer_schema": {
    "text": ""
  },
  "examples": ["Example answer 1", "Example answer 2"],
  "tags": {
    "included_in_manifests": ["lite", "full"]
  }
}
```

### 2. single_select

Pick one option from a list.

```json
{
  "id": "q02",
  "section_id": "s1",
  "order": 2,
  "title": "Question title",
  "prompt": "Choose one option",
  "type": "single_select",
  "options": [
    { "value": "option_1", "label": "Option 1 label" },
    { "value": "option_2", "label": "Option 2 label" },
    { "value": "other", "label": "Other (write in)" }
  ],
  "answer_schema": {
    "selected_value": "",
    "other_text": "",
    "notes": ""
  },
  "examples": ["Example selection"],
  "tags": { "included_in_manifests": ["lite", "full"] }
}
```

### 3. multi_select

Pick multiple options from a list.

```json
{
  "id": "q03",
  "section_id": "s1",
  "order": 3,
  "title": "Question title",
  "prompt": "Select all that apply",
  "type": "multi_select",
  "options": [
    { "value": "opt_a", "label": "Option A" },
    { "value": "opt_b", "label": "Option B" },
    { "value": "other", "label": "Other (write in)" }
  ],
  "validation": {
    "max_selected": 5
  },
  "answer_schema": {
    "selected_values": [],
    "other_text": "",
    "ranking": [],
    "notes": ""
  },
  "examples": ["Option A + Option B"],
  "tags": { "included_in_manifests": ["full"] }
}
```

### 4. compound

Multiple fields in one question (most complex type).

```json
{
  "id": "q04",
  "section_id": "s1",
  "order": 4,
  "title": "Question title",
  "prompt": "Complex question with multiple parts",
  "type": "compound",
  "fields": [
    {
      "key": "field_name",
      "label": "Field label",
      "type": "single_select|multi_select|short_text|free_text|number",
      "options": [/* for select types */],
      "placeholder": "for text types",
      "min": 1,
      "showWhen": {
        "field": "other_field_key",
        "equals": "specific_value",
        "in": ["value1", "value2"],
        "includes": "value"
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
        "if": { "field": "field_name", "equals": "value" },
        "then_require": ["other_field"]
      }
    ]
  },
  "examples": ["Example compound answer"],
  "tags": { "included_in_manifests": ["lite", "full"] }
}
```

---

## Compound Field Types

| Type | Description | Extra Properties |
| ------ | ----------- | ------------------ |
| `single_select` | Radio buttons | `options` array |
| `multi_select` | Checkboxes | `options` array |
| `ranked_select` | Select + drag-to-rank | `options` array, `validation` |
| `short_text` | One-line input | `placeholder` |
| `free_text` | Multi-line textarea | `placeholder` |
| `number` | Numeric input | `min`, `max` |

### ranked_select (Select and Rank)

Allows users to select multiple options and drag-to-reorder by priority. Output is an ordered array where index 0 = highest priority.

```json
{
  "key": "reasons_ranked",
  "label": "Select and rank your reasons (top = most important)",
  "type": "ranked_select",
  "options": [
    { "value": "reason_a", "label": "Reason A" },
    { "value": "reason_b", "label": "Reason B" },
    { "value": "reason_c", "label": "Reason C" },
    { "value": "other", "label": "Other (write in)" }
  ]
}
```

**Output format**: `["reason_b", "reason_a"]` (ordered array, first = #1 priority)

**UI behavior**:

1. Left panel shows checkboxes to select applicable options
2. Right panel shows selected items with drag handles for reordering
3. Items can be removed via × button (also unchecks the checkbox)
4. Top item is considered the "primary" choice

### showWhen Conditions

```json
"showWhen": {
  "field": "parent_field_key",
  "equals": "exact_value",
  "in": ["value1", "value2"],
  "includes": "value_in_array"
}
```

---

## prompts.json Structure

```json
{
  "schema_version": "1.2.0",
  "artifact": {
    "id": "unique_prompts_id",
    "title": "Prompts Title",
    "language": "en-US",
    "applies_to": "matching_questions_artifact_id"
  },
  "privacy_preface": {
    "title": "Privacy Preface Title",
    "text": "Privacy guidance text"
  },
  "prompts": {
    "individual_reflection_lite": { /* Prompt template */ },
    "individual_reflection_full": { /* Prompt template */ },
    "couple_reflection_lite": { /* Prompt template */ },
    "couple_reflection_full": { /* Prompt template */ }
  }
}
```

---

## Prompt Template Structure

```json
{
  "id": "unique_prompt_id",
  "title": "Human-readable title",
  "description": "Who should use this prompt",
  "role": "AI system role/persona instruction",
  "inputs": [
    {
      "key": "respondent_display_name",
      "label": "Your name",
      "placeholder": "Your name"
    },
    {
      "key": "responses",
      "label": "Your questionnaire responses",
      "placeholder": "Paste your completed responses here."
    }
  ],
  "context": [
    "Context line 1 about this phase",
    "Context line 2 about what questions cover",
    "Context line 3 about the AI's job"
  ],
  "output_format": [
    {
      "section": "Section Title",
      "requirements": [
        "What should be in this section",
        "Another requirement"
      ]
    }
  ],
  "constraints": [
    "Never do X",
    "Always do Y",
    "Keep language warm and practical"
  ]
}
```

---

## Prompt Keys (Required)

| Key | Mode | Type | Description |
| ----- | ------ | ------ | ------------- |
| `individual_reflection_lite` | lite | Individual | Personal insight for lite completion |
| `individual_reflection_full` | full | Individual | Deep insight for full completion |
| `couple_reflection_lite` | lite | Couple | Relationship guidance for lite |
| `couple_reflection_full` | full | Couple | Deep relationship blueprint for full |

---

## Quick Reference

### Question ID Format

- Use sequential IDs: `q01`, `q02`, `q03`...
- Match IDs in `sections[].question_ids` and `manifests[].question_ids`

### Section ID Format

- Use sequential IDs: `s1`, `s2`, `s3`...

### Tags

```json
"tags": {
  "included_in_manifests": ["lite", "full"]
}
```

- `["lite", "full"]` = appears in both modes
- `["full"]` = only appears in full mode

### Order

- `order` must be unique and sequential (1, 2, 3...)
- Determines display order within the questionnaire
