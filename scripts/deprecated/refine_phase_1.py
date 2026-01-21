
import json
import os
import glob

# Content Map for Phase 1 (Couples/Early Dating Context)
content_map = {
    "q01": [
        "Yes (e.g., legally and emotionally free to date).",
        "Separated (e.g., in process but living apart).",
        "Complicated (e.g., situationship ending).",
        "Widowed (e.g., processing loss)."
    ],
    "q02": [
        "Time: 6 months. Major: lived together. Ended: mutual.",
        "Time: 2 years. Major: engaged. Ended: they left."
    ],
    "q03": [
        "None (e.g., complete clean break).",
        "Logistical (e.g., share custody/kids).",
        "Friendly (e.g., occasional text, clear boundaries).",
        "Processing (e.g., still think about them often)."
    ],
    "q04": [
        "Neutral (e.g., I wish them well but have moved on).",
        "Sad (e.g., grief comes in waves).",
        "Angry (e.g., I still feel resentful).",
        "Mixed (e.g., grateful for good times, glad it ended)."
    ],
    "q05": [
        "Yes (e.g., I feel safe).",
        "Mostly (e.g., generally safe, minor concerns).",
        "No (Please prioritize your safety)."
    ],
    "q06": [
        "Primary: Emotional safety. Pattern: New/Healthy.",
        "Primary: Chemistry. Pattern: Familiar (reminds me of ex)."
    ],
    "q07": [
        "Top Reasons: 1) Genuine connection, 2) Values alignment. Urgency: Low.",
        "Top Reasons: 1) Loneliness, 2) Physical attraction. Urgency: High."
    ],
    "q08": [
        "Move on (e.g., I'd be sad but recover).",
        "Disappointed (e.g., it would sting).",
        "Crushed (e.g., I'm already very attached)."
    ],
    "q09": [
        "Equal (e.g., mutual effort).",
        "Me more (e.g., I initiate most texts).",
        "Them more (e.g., they are pursuing me hard)."
    ],
    "q10": [
        "I tend to over-give to earn love.",
        "I withdraw when I feel criticized.",
        "I ignore red flags because the chemistry is high."
    ],
    "q11": [
        "Top Dealbreakers: 1) Active addiction, 2) Dishonesty, 3) Faith mismatch.",
        "Top Dealbreakers: 1) Smoking, 2) Bad with money, 3) No ambition."
    ],
    "q12": [
        "Yes (e.g., I see no major red flags).",
        "Maybe (e.g., one or two yellow flags).",
        "No (e.g., I am ignoring something big)."
    ],
    "q13": [
        "They are consistent (e.g., words match actions).",
        "They are vague (e.g., hard to pin down plans).",
        "They are intense (e.g., moving very fast)."
    ],
    "q14": [
        "Yes (e.g., sexual/physical attraction).",
        "Growing (e.g., not fireworks, but nice).",
        "No (e.g., more like friends)."
    ],
    "q15": [
        "Aligned (e.g., we want the same things).",
        "Unclear (e.g., haven't discussed it).",
        "Misaligned (e.g., they want casual, I want serious)."
    ],
    "q17": [
        "Anxious (e.g., need reassurance).",
        "Secure (e.g., can self-soothe).",
        "Avoidant (e.g., need space)."
    ],
    "q18": [
        "I speak up (e.g., clear communication).",
        "I shut down (e.g., go silent).",
        "I get defensive (e.g., explain myself)."
    ],
    "q19": [
        "I listen well.",
        "I interrupt.",
        "I try to fix it."
    ],
    "q20": [
        "I can be critical.",
        "I struggle to apologize.",
        "I get quiet when mad."
    ],
    "q22": [
        "Words of Affirmation.",
        "Physical Touch.",
        "Quality Time.",
        "Acts of Service."
    ],
    "q23": [
        "I feel chosen.",
        "I feel anxious.",
        "I feel smothered."
    ],
    "q24": [
        "Daily texts.",
        "Calls every few days.",
        "Constant contact."
    ],
    "q26": [
        "Easy (e.g., flows naturally).",
        "Stilted (e.g., hard to find topics).",
        "Deep (e.g., quickly gets serious)."
    ],
    "q27": [
        "We talk it out.",
        "We take space then return.",
        "We haven't fought yet."
    ],
    "q28": [
        "Yes (e.g., I feel heard).",
        "Sometimes (e.g., depends on the topic).",
        "No (e.g., they dismiss my feelings)."
    ],
    "q30": [
        "Aligned (e.g., same faith tradition).",
        "Respectful difference (e.g., different but compatible).",
        "Conflict (e.g., creates tension)."
    ],
    "q31": [
        "Yes (e.g., same political/social views).",
        "Mostly (e.g., agree on big things).",
        "No (e.g., significant differences)."
    ],
    "q32": [
        "Yes (e.g., we save/spend similarly).",
        "Unsure (e.g., haven't discussed money).",
        "No (e.g., they seem impulsive)."
    ],
    "q33": [
        "Yes (e.g., we want the same family life).",
        "Maybe (e.g., still figuring it out).",
        "No (e.g., one wants kids, one doesn't)."
    ],
    "q35": [
        "Slow (e.g., friends first).",
        "Steady (e.g., dating intentionally).",
        "Fast (e.g., spending every day together)."
    ],
    "q36": [
        "Exclusive.",
        "Dating but not exclusive.",
        "Talking stage."
    ],
    "q37": [
        "Waiting for marriage.",
        "Physical affection only.",
        "Sexually active.",
        "Discussing boundaries."
    ],
    "q39": [
        "Close (e.g., same city).",
        "Driveable (e.g., 1-2 hours).",
        "Long distance (e.g., flight required)."
    ],
    "q40": [
        "Plenty (e.g., this is a priority).",
        "Moderate (e.g., implies rescheduling).",
        "Limited (e.g., very busy)."
    ],
    "q41": [
        "Work schedule.",
        "Custody schedule.",
        "Health issues."
    ],
    "q43": [
        "Therapy.",
        "Mentorship.",
        "Reading/Self-study.",
        "None right now."
    ],
    "q44": [
        "I own my stuff.",
        "I blame them.",
        "I avoid the topic."
    ],
    "q46": [
        "Green light (e.g., proceed with confidence).",
        "Yellow light (e.g., proceed with caution).",
        "Red light (e.g., stop)."
    ],
    "q47": [
        "I feel hopeful.",
        "I feel excited.",
        "I feel cautious.",
        "I feel dread."
    ],
    "q48": [
        "Continue dating.",
        "Move to exclusivity.",
        "Break it off.",
        "Pause."
    ]
}

questions_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_1\questions"
question_files = glob.glob(os.path.join(questions_dir, "q*.json"))

print(f"Starting Phase 1 update for {len(question_files)} files...")

for file_path in question_files:
    filename = os.path.basename(file_path)
    qid = filename.replace(".json", "")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue
            
    # 1. Update Examples if in map, otherwise leave (or set empty if we want to be safe)
    if qid in content_map:
        data['examples'] = content_map[qid]
    else:
        # If not in map, might be a gap, but for now we won't wipe existing unless needed.
        pass
        
    # 2. Update Schema to ensure 'notes' exists
    # Check regular answer_schema
    if 'answer_schema' in data:
        if 'notes' not in data['answer_schema']:
            data['answer_schema']['notes'] = ""
    
    # Also check fields for compound types if they have schemas there (Phase 1 structure varies)
    if 'fields' in data:
        for field in data['fields']:
             # sometimes fields have 'answer_schema' nested? No, usually flat in data['answer_schema']
             pass

    # Save back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
print("Phase 1 Update complete.")
