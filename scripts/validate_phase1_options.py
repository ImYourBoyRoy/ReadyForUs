# ./scripts/validate_phase1_options.py
"""Quick validation of Phase 1 options extraction."""

import json
from pathlib import Path

d = json.load(open(Path(__file__).parent.parent / 'data/phase_1/questions.json'))

checks = [
    ('q02', 'how_it_ended'),
    ('q03', 'entanglement_level'),
    ('q03', 'would_partner_worry'),
    ('q06', 'primary_pull'),
    ('q06', 'pattern_awareness'),
    ('q07', 'reasons_ranked'),
    ('q11', 'dealbreakers_ranked'),
    ('q13', 'faith_context'),
    ('q13', 'current_alignment'),
    ('q17', 'reaction_pattern'),
    ('q17', 'recovery_time'),
    ('q18', 'stress_behavior'),
    ('q22', 'bonding_speed'),
    ('q22', 'what_causes_pullback'),
    ('q23', 'reassurance_forms'),
    ('q23', 'frequency_needed'),
    ('q26', 'preferred_approach'),
    ('q26', 'timing_matters'),
    ('q30', 'importance'),
    ('q30', 'tradition'),
    ('q31', 'values_ranked'),
    ('q35', 'goal'),
    ('q35', 'timeline'),
    ('q36', 'exclusivity_preference'),
    ('q36', 'multi_dating'),
    ('q37', 'comfort_level_now'),
    ('q39', 'current_kids'),
    ('q39', 'want_more_kids'),
    ('q43', 'growth_areas_ranked'),
    ('q44', 'primary_need'),
    ('q46', 'state_or_typical'),
]

print("Checking fields for options...\n")

missing = []
found = []
for q_id, field_key in checks:
    q = d['questions'].get(q_id)
    if not q:
        missing.append(f'{q_id}: Question not found')
        continue
    fields = q.get('fields', [])
    field = next((f for f in fields if f['key'] == field_key), None)
    if not field:
        missing.append(f'{q_id}.{field_key}: Field not found')
        continue
    opts = field.get('options', [])
    if not opts:
        missing.append(f'{q_id}.{field_key}: No options ({field.get("type")})')
    else:
        found.append(f'{q_id}.{field_key}: {len(opts)} options')

print(f"FOUND ({len(found)}):")
for f in found[:10]:
    print(f'  + {f}')
if len(found) > 10:
    print(f'  ... and {len(found)-10} more')

if missing:
    print(f"\nMISSING ({len(missing)}):")
    for m in missing:
        print(f'  - {m}')
else:
    print("\nAll checked fields have options!")
