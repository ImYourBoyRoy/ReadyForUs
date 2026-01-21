
import json
import os
import glob

# Enhanced Content Map for Phase 1.5
# Goal: Use "Option (e.g., context)" format or descriptive scenarios that explain the "Why".
content_map = {
    "q01": [
        "Exploration (e.g., seeing what is out there without pressure).",
        "Discernment (e.g., dating intentionally to see if we align).",
        "Long-term potential (e.g., looking for a serious partner).",
        "Companionship (e.g., enjoy shared time but not rushing)."
    ],
    "q02": [
        "Slow and intentional (e.g., taking time to build trust).",
        "Playful and light (e.g., enjoying fun over heavy talks).",
        "Structured (e.g., knowing when we will see each other next)."
    ],
    "q03": [
        "No momentum (e.g., weeks between dates).",
        "Vague plans (e.g., 'let's hang sometime' but no date set).",
        "Lack of depth (e.g., only small talk after several dates)."
    ],
    "q04": [
        "Forced exclusivity (e.g., pressure to label it day one).",
        "Love bombing (e.g., intense praise/gifts too early).",
        "Trauma dumping (e.g., sharing deepest wounds on first date)."
    ],
    "q05": [
        "After 4 dates: Review expectations and physical boundaries.",
        "After 1 month: Review exclusivity and communication style.",
        "After first conflict: Review how we repair and move forward."
    ],
    "q06": [
        "Weekly (e.g., Sunday night check-in over tea).",
        "Bi-weekly (e.g., longer deep dive every other week).",
        "As needed (e.g., we pause whenever one of us feels 'off')."
    ],
    "q07": [
        "I pull inward (e.g., I get quiet). Best response: Gentle presence, don't push.",
        "I seek reassurance (e.g., I ask 'are we okay?'). Best response: Verbal affirmation.",
        "I overthink (e.g., I analyze texts). Best response: Clear direct communication."
    ],
    "q08": [
        "Not rushed (e.g., I have time to process).",
        "Emotionally seen (e.g., my feelings are validated).",
        "Free to leave (e.g., I choose to stay because I want to)."
    ],
    "q09": [
        "Listen (e.g., just hear me out, don't fix).",
        "Help (e.g., take a task off my plate).",
        "Space (e.g., let me decompress alone for an hour)."
    ],
    "q10": [
        "Slowly (e.g., share stories as they become relevant).",
        "Fully (e.g., lay it all out so there are no surprises).",
        "Relevance only (e.g., only if it impacts us now)."
    ],
    "q11": [
        "Subtle touch (e.g., hand on back, sitting close).",
        "holding hands (e.g., connection while walking).",
        "Verbal affection (e.g., hearing 'I appreciate you')."
    ],
    "q12": [
        "Ask directly (e.g., 'Can I kiss you?').",
        "Non-verbal (e.g., lean in and wait for signal).",
        "Soft check-in (e.g., 'I'm thinking about kissing you')."
    ],
    "q13": [
        "Private only (e.g., no PDA).",
        "Subtle public (e.g., holding hands is okay).",
        "Comfortable (e.g., arm around shoulder at dinner)."
    ],
    "q14": [
        "Casual group (e.g., meet at a game night).",
        "One-on-one (e.g., meet my best friend for coffee).",
        "Wait (e.g., only after we are exclusive)."
    ],
    "q15": [
        "Private (e.g., no social media posts yet).",
        "Stories (e.g., temporal posts are okay).",
        "Soft launch (e.g., photo of hand/drink, no face)."
    ],
    "q16": [
        "Wait (e.g., 6 months or serious commitment).",
        "Casual (e.g., brief hello if we bump into them).",
        "Intentional (e.g., planned dinner)."
    ],
    "q17": [
        "Partnership (e.g., building a life team).",
        "Adventure (e.g., exploring the world together).",
        "Sanctuary (e.g., a safe place to rest)."
    ],
    "q18": [
        "Integrity (e.g., doing what we say).",
        "Growth (e.g., always learning).",
        "Fun (e.g., prioritizing play)."
    ],
    "q19": [
        "Shared faith (e.g., praying together).",
        "Shared values (e.g., kindness and service).",
        "Respect (e.g., honoring different beliefs)."
    ],
    "q20": [
        "Agree (e.g., aligned on major issues).",
        "Respectful debate (e.g., enjoy discussing differences).",
        "Private (e.g., keep politics out of relationship)."
    ],
    "q21": [
        "Rotate (e.g., I get this one, you get next).",
        "Split (e.g., Venmo or separate checks).",
        "Income-based (e.g., whoever earns more pays more)."
    ],
    "q22": [
        "Egalitarian (e.g., equal partners in all things).",
        "Traditional (e.g., distinct gender roles).",
        "Fluid (e.g., based on strengths/capacity)."
    ],
    "q23": [
        "Yes (e.g., active desire for family).",
        "No (e.g., happy as a couple).",
        "Open (e.g., willing to discuss)."
    ],
    "q24": [
        "Dishonesty (e.g., any lying breaks trust).",
        "Addiction (e.g., untreated substance issues).",
        "Contempt (e.g., mocking or disrespect)."
    ],
    "q25": [
        "Sincere apology (e.g., 'I was wrong, I'm sorry').",
        "Changed behavior (e.g., showing you learned).",
        "Listening (e.g., hearing my hurt without defending)."
    ],
    "q26": [
        "Withdraw (e.g., I go silent).",
        "Pursue (e.g., I try to fix it immediately).",
        "Analyze (e.g., I want to talk through every detail)."
    ],
    "q27": [
        "Pause (e.g., 'Can we take 10 mins?').",
        "Hold hands (e.g., physical touch grounds us).",
        "Soft tone (e.g., consciously lowering voice)."
    ],
    "q28": [
        "Curiosity (e.g., 'Help me understand').",
        "Ownership (e.g., 'I contributed to this by...').",
        "Affirmation (e.g., 'We are on the same team')."
    ],
    "q29": [
        "No name calling.",
        "No leaving without saying when you'll return.",
        "No bringing up resolved past issues."
    ],
    "q30": [
        "Within 24 hours.",
        "Before sleep (don't go to bed angry).",
        "When emotions settle (even if it takes a day)."
    ],
    "q31": [
        "Early bird (e.g., up at 6am).",
        "Night owl (e.g., up until 1am).",
        "Flexible (e.g., adapt to schedule)."
    ],
    "q32": [
        "Tidy (e.g., clean as I go).",
        "Cluttered (e.g., disorganized but clean).",
        "Messy (e.g., struggle to keep up)."
    ],
    "q33": [
        "Homebody (e.g., prefer nights in).",
        "Social (e.g., out with friends often).",
        "Balanced (e.g., 1-2 nights out/week)."
    ],
    "q34": [
        "Pets are family (e.g., sleep in bed).",
        "Pets are pets (e.g., kept off furniture).",
        "No pets."
    ],
    "q35": [
        "Secure (e.g., rarely jealous).",
        "Anxious (e.g., need reassurance).",
        "Protective (e.g., territorial)."
    ],
    "q36": [
        "Consistency (e.g., steady communication).",
        "Transparency (e.g., open phone/schedule).",
        "Proximity (e.g., spending time together)."
    ],
    "q37": [
        "Open (e.g., know each other's passcodes).",
        "Private (e.g., phone is personal space).",
        "Balanced (e.g., use around each other freely)."
    ],
    "q38": [
        "Closed chapter (e.g., don't discuss much).",
        "Open book (e.g., comfortable sharing history).",
        "Friends (e.g., exes are still in life)."
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
    if 'answer_schema' in data:
        if 'notes' not in data['answer_schema']:
            data['answer_schema']['notes'] = ""
    
    # Save back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
print("Phase 1.5 Update complete.")
