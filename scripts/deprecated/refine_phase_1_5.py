
import json
import os
import glob

# Content Map for Phase 1.5 (Couples/Early Dating Context)
content_map = {
    "q01": [
        "I'm exploring connection with long-term potential.",
        "I'm discerning slowly and intentionally."
    ],
    "q02": [
        "Slow and intentional + playful and light.",
        "Clear and predictable without intensity."
    ],
    "q03": [
        "No intentional plans.",
        "Avoiding clarity for weeks.",
        "Feeling like an option."
    ],
    "q04": [
        "Pressure to define the relationship right now.",
        "Pressure for exclusivity immediately.",
        "Future-casting to soothe anxiety."
    ],
    "q05": [
        "After 4 more dates, to review expectations and public-ness.",
        "After our first kiss, to review pacing and whether we want a label soon.",
        "After 3 weeks, to confirm our focus agreement."
    ],
    "q06": [
        "Bi-weekly, in person, within 24 hours if something feels off.",
        "Weekly, walk and talk, same-day if it's escalating."
    ],
    "q07": [
        "I tend to get quiet. Best response: hold my hand and ask one simple question.",
        "Do not assume I'm pulling away; I'm regulating."
    ],
    "q08": [
        "Safe means I can slow down without you taking it personally.",
        "Safe means affection is invited, not assumed.",
        "Safe means hard talks don't threaten the connection."
    ],
    "q09": [
        "One thing: stay close and grounded with me. Avoid: making it a debate.",
        "One thing: ask what I need, then do the simplest version of it."
    ],
    "q10": [
        "High-level for now, details later.",
        "Only if it affects us today."
    ],
    "q11": [
        "Hand holding + forehead/nose feels perfect.",
        "Cuddling yes, kissing later."
    ],
    "q12": [
        "Ask directly (e.g., 'Can I kiss you?').",
        "Soft check-in (e.g., lean in and wait)."
    ],
    "q13": [
        "Minimal (e.g., hand holding is okay).",
        "Moderate (e.g., arm around shoulder is okay).",
        "Zero (e.g., private only)."
    ],
    "q14": [
        "Meet one close friend first.",
        "Group hang where we can just be normal.",
        "Wait until we are exclusive."
    ],
    "q15": [
        "No posting yet.",
        "Stories are okay, main feed wait.",
        "Tagging is okay."
    ],
    "q16": [
        "Wait until we are serious.",
        "Meet siblings first.",
        "Meet parents in a casual setting."
    ],
    "q17": [
        "A partnership based on faith and service.",
        "A fun, travel-filled companionship.",
        "A stable family life."
    ],
    "q18": [
        "We prioritize family time.",
        "We support each other's careers.",
        "We live simply."
    ],
    "q19": [
        "We are both active in the same faith.",
        "We respect each other's different views.",
        "We figure it out as we go."
    ],
    "q20": [
        "We generally agree on politics.",
        "We agree to disagree respectfully.",
        "We avoid the topic."
    ],
    "q21": [
        "We split dates 50/50.",
        "We take turns paying.",
        "One person pays, the other handles tips/extras."
    ],
    "q22": [
        "Traditional roles (e.g., distinct leadership).",
        "Egalitarian (e.g., equal partnership).",
        "Flexible/Hybrid."
    ],
    "q23": [
        "Yes, we both want kids.",
        "No, neither of us wants kids.",
        "One wants them, one is unsure."
    ],
    "q24": [
        "Dealbreaker: dishonesty.",
        "Dealbreaker: smoking.",
        "Dealbreaker: unwillingness to go to therapy."
    ],
    "q25": [
        "I need a direct apology ('I'm sorry').",
        "I need changed behavior.",
        "I need to understand your intent."
    ],
    "q26": [
        "I tend to withdraw.",
        "I tend to pursue/fix.",
        "I tend to freeze."
    ],
    "q27": [
        "When I feel attacked, I shut down.",
        "When I feel attacked, I get loud.",
        "When I feel attacked, I cry."
    ],
    "q28": [
        "We take a break, then talk.",
        "We hold hands while we talk.",
        "We write it down."
    ],
    "q29": [
        "Don't walk away without saying when you'll be back.",
        "Don't bring up past fights.",
        "Don't name call."
    ],
    "q30": [
        "Yes, 20 minutes is good.",
        "No, timeouts make me anxious.",
        "Only if we agree on it beforehand."
    ],
    "q31": [
        "I'm an early riser.",
        "I'm a night owl.",
        "I need 8 hours of sleep."
    ],
    "q32": [
        "I'm very tidy.",
        "I'm somewhat messy but clean common areas.",
        "I hire help."
    ],
    "q33": [
        "I love hosting people.",
        "I prefer quiet nights in.",
        "I like going out."
    ],
    "q34": [
        "I have a dog who sleeps in bed.",
        "I'm allergic to cats.",
        "I don't have pets."
    ],
    "q35": [
        "I get jealous easily.",
        "I rarely get jealous.",
        "I get jealous if things are hidden."
    ],
    "q36": [
        "Words of affirmation help.",
        "Physical touch helps.",
        "Quality time helps."
    ],
    "q37": [
        "My phone is private.",
        "Open phone policy.",
        "Ask before looking."
    ],
    "q38": [
        "We don't talk about exes.",
        "We are open about our past.",
        "We are friends with exes."
    ]
}

questions_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1.5\questions"
question_files = glob.glob(os.path.join(questions_dir, "q*.json"))

print(f"Starting Phase 1.5 update for {len(question_files)} files...")

for file_path in question_files:
    filename = os.path.basename(file_path)
    qid = filename.replace(".json", "")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue
            
    # 1. Update Examples if in map
    if qid in content_map:
        data['examples'] = content_map[qid]
        
    # 2. Update Schema to ensure 'notes' exists
    # Check regular answer_schema
    if 'answer_schema' in data:
        if 'notes' not in data['answer_schema']:
            data['answer_schema']['notes'] = ""
    
    # Save back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
print("Phase 1.5 Update complete.")
