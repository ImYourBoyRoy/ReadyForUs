# ./data/phase_2/scripts/populate_examples.py
"""
Populates 'examples' field in data/phase_2/questions/q##.json files.
Contains deeply thorough, context-aware examples for all 48 Phase 2 questions.

Usage:
    python data/phase_2/scripts/populate_examples.py
"""

import os
import json

QUESTIONS_DIR = r'data\phase_2\questions'

# Deeply thorough examples for Phase 2 (DTR Check-in)
EXAMPLES_MAP = {
    "q01": [
        "How long have you known each other: 2 years. Dating: 6 months. Seeing each other: weekly.",
        "How long have you known each other: 3 months. Dating: 3 months. Seeing each other: multiple times/week."
    ],
    "q02": [
        "Warmth or smile (e.g., I feel immediate happiness when their name pops up).",
        "Anxious or tight (e.g., I worry about what they want or if I'm in trouble).",
        "Neutral or flat (e.g., it doesn't really change my mood much)."
    ],
    "q03": [
        "Recharged (e.g., I feel more energetic and lighter after hanging out).",
        "Tired but happy (e.g., it was good, but I need some alone time to recover).",
        "Tired and stressed (e.g., I feel drained or like I worked hard to keep things going)."
    ],
    "q04": [
        "None (e.g., I can be weird, quiet, or loud, and they accept it all).",
        "Light filtering (e.g., I'm mostly myself but hold back slightly on controversial opinions).",
        "Heavy masking (e.g., I feel like I'm playing a character to keep them interested)."
    ],
    "q05": [
        "Examples: consistently planning dates, feeling safe sharing fears, laughing together easily.",
        "Examples: they respect my boundaries, we have great physical chemistry, they get along with my friends.",
        "Moment: When I was sick last week, they brought me soup and didn't make a big deal of it."
    ],
    "q06": [
        "Comfortably paced (e.g., things are moving at a speed that feels right for both of us).",
        "Too fast (e.g., they are talking about marriage and I'm still figuring out if I like them).",
        "Too slow (e.g., it feels stagnant and I want more momentum)."
    ],
    "q07": [
        "Exploring (e.g., we are just having fun and getting to know each other).",
        "Functionally exclusive (e.g., we haven't said it, but neither of us is looking elsewhere).",
        "Exclusive (e.g., we have had the talk and are committed)."
    ],
    "q08": [
        "Exclusivity (e.g., we agree to close our dating apps and focus only on each other).",
        "Clear label (e.g., I want to call them my boyfriend/girlfriend/partner).",
        "Future intent (e.g., I want to know if we are building toward something long-term)."
    ],
    "q09": [
        "No dating others: We stop seeing other people entirely.",
        "No flirting: We stop entertaining interest from others.",
        "Deleting apps: We remove dating profiles.",
        "Transparency: We tell each other if an ex reaches out."
    ],
    "q10": [
        "Desire (e.g., I really like them and want to secure this connection).",
        "Safety (e.g., I need to know where I stand so I can stop feeling anxious).",
        "Logic (e.g., we've been dating 6 months, it's time to decide).",
        "Fear (e.g., I'm terrified they will meet someone else if I don't lock it down)."
    ],
    "q11": [
        "Communication consistency: I expect us to talk every day.",
        "Social visibility: I expect to meet their friends soon.",
        "Emotional responsibility: I expect them to care more about my feelings.",
        "Nothing major: We are already acting like a couple, I just want the title."
    ],
    "q12": [
        "Expectation: That I become their priority on weekends.",
        "Expectation: That they stop talking to their ex.",
        "Expectation: That we start planning a trip together."
    ],
    "q13": [
        "Steady but simple (e.g., a daily check-in text is enough).",
        "Consistent and connected (e.g., regular texting throughout the day and goodnight calls).",
        "Highly integrated (e.g., always knowing where the other person is)."
    ],
    "q14": [
        "Yes (we have explicitly agreed to be exclusive).",
        "No (we are still technically free to see others).",
        "It's complicated (we act exclusive but haven't defined it)."
    ],
    "q15": [
        "Very steady (e.g., their actions match their words completely).",
        "Mostly steady (e.g., usually good, but they sometimes go silent).",
        "Unclear (e.g., I'm constantly guessing if they are still interested)."
    ],
    "q16": [
        "Aligned: We both want to see each other twice a week.",
        "Mismatched on physical pace: They want to move faster sexually than I do.",
        "Mismatched on emotional pace: I am falling in love, they are still 'seeing how it goes'."
    ],
    "q17": [
        "Healthy (e.g., meeting friends felt natural and fun).",
        "Too fast (e.g., meeting parents after 3 weeks felt like too much pressure).",
        "Too slow (e.g., I feel hidden because I haven't met anyone in their life yet)."
    ],
    "q18": [
        "Seamless (e.g., we are both morning people and like a tidy house).",
        "Complementary (e.g., I cook, they clean; I plan, they execute).",
        "Friction (e.g., their messiness stresses me out constantly)."
    ],
    "q19": [
        "No concern: Everything feels green light.",
        "Yes: Conflict behavior (they shut down and won't talk for days).",
        "Yes: Money habits (they seem financially irresponsible)."
    ],
    "q20": [
        "Yes (e.g., I can share my deepest fears and they listen without judgment).",
        "Mostly (e.g., I share most things, but hide my anxiety to not look 'needy').",
        "No (e.g., I worry they will think less of me if I show weakness)."
    ],
    "q21": [
        "No (e.g., I feel free to bring up issues).",
        "Sometimes (e.g., I hesitate to bring up needs because they might get annoyed).",
        "Yes, regularly (e.g., I constantly monitor their mood to avoid conflict)."
    ],
    "q22": [
        "Yes (e.g., they respect my 'no' always).",
        "Mixed (e.g., they are mostly respectful, but sometimes pushy about time)."
    ],
    "q23": [
        "Regulated (e.g., I feel calm and safe with them).",
        "Open and hopeful (e.g., I feel excited about the future context).",
        "Anxious/activated (e.g., I feel on edge or hyper-vigilant)."
    ],
    "q24": [
        "We talk and repair (e.g., we can disagree but come back together stronger).",
        "We avoid it (e.g., we pretend nothing happened and just move on).",
        "Escalates (e.g., small disagreements turn into big fights)."
    ],
    "q25": [
        "More connected (e.g., resolving it made us feel closer).",
        "About the same (e.g., we got through it).",
        "Less safe (e.g., I'm afraid to bring it up again)."
    ],
    "q26": [
        "None (e.g., we have discussed everything difficult).",
        "Money (e.g., I haven't asked about their debt yet).",
        "Faith (e.g., I'm worried our religious views are too different)."
    ],
    "q27": [
        "Not okay: Yelling, name-calling, stonewalling.",
        "Response: 'I can't continue this conversation while you are yelling. Let's take 20 minutes.'"
    ],
    "q28": [
        "Aligned (e.g., we both value family and honesty deeply).",
        "Misaligned (e.g., they prioritize work over everything, I prioritize connection).",
        "Mixed (e.g., we share political views but differ on financial goals)."
    ],
    "q29": [
        "No (e.g., I accept them exactly as they are today).",
        "Yes (e.g., I hope they become more ambitious/cleaner/more communicative)."
    ],
    "q30": [
        "I hope they will start planning dates more often once we are 'official'.",
        "I hope they will be more open about their feelings."
    ],
    "q31": [
        "More myself (e.g., I feel freer and more authentic with them).",
        "Edited (e.g., I hold back my true personality to fit what they like)."
    ],
    "q32": [
        "No potential dealbreakers.",
        "Yes: Life direction (they want to be nomadic, I want roots).",
        "Yes: Kids (they are unsure, I definitely want them)."
    ],
    "q33": [
        "Grounded desire (e.g., I want this partnership because it adds to my life).",
        "Anxiety (e.g., I'm afraid of being alone or losing them).",
        "Both (e.g., I really like them, but I'm also scared)."
    ],
    "q34": [
        "Calm/settled (e.g., a warm feeling in my chest).",
        "Excited/energized (e.g., butterflies and smiles).",
        "Tight/uneasy (e.g., a knot in my stomach)."
    ],
    "q35": [
        "Understanding (e.g., I'm willing to wait if they need time).",
        "Hurt (e.g., I would feel rejected and sad).",
        "Relief (e.g., honestly, I'm not ready either)."
    ],
    "q36": [
        "Define it now (e.g., I'm ready to commit fully).",
        "Move toward it (e.g., keep dating exclusively but no label yet).",
        "Step back (e.g., I need space to think)."
    ],
    "q37": [
        "8: I feel very good about us, just want to clarify one boundary.",
        "10: I am completely at peace and excited to define this.",
        "3: I have too many doubts right now."
    ],
    "q38": [
        "More time (e.g., I need a few more weeks to see consistency).",
        "Hard conversation (e.g., we need to talk about finances first).",
        "Meeting family (e.g., I need to see how they are with my siblings)."
    ],
    "q39": [
        "They must be willing to go to therapy if we get stuck.",
        "We must agree on being exclusive.",
        "They must be open about their past relationships."
    ],
    "q40": [
        "We should cool things off and see other people.",
        "We should keep dating but check in again in 2 weeks.",
        "We should break up if we aren't on the same page."
    ],
    "q41": [
        "No (e.g., I am being totally honest with myself).",
        "Yes (e.g., deep down I know they aren't 'the one', but I don't want to be lonely)."
    ],
    "q42": [
        "Central (e.g., my faith guides all my decisions).",
        "Important (e.g., it matters but isn't the only factor).",
        "Not relevant (e.g., I am not religious)."
    ],
    "q43": [
        "Supports (e.g., we pray together and encourage each other).",
        "Strains (e.g., we argue about how we spend Sundays)."
    ],
    "q44": [
        "Shared worship (e.g., going to church together).",
        "Sexual standards (e.g., waiting for marriage).",
        "Tithing (e.g., agreement on charitable giving)."
    ],
    "q45": [
        "Direct and honest (e.g., just tell me the truth).",
        "Gentle and validating (e.g., be kind and supportive).",
        "Structured (e.g., give me a plan)."
    ],
    "q46": [
        "Mostly challenged (e.g., push me to grow).",
        "Mostly comforted (e.g., tell me it's going to be okay)."
    ],
    "q47": [
        "My readiness (e.g., am I seeing this clearly?).",
        "Their signals (e.g., are they really interested?)."
    ],
    "q48": [
        "Just for me (e.g., I want to process this privately).",
        "Shareable summary (e.g., I want something I can show my partner or friend)."
    ]
}

def update_file(filepath):
    filename = os.path.basename(filepath)
    qid = filename.replace('.json', '')
    
    # Skip if no examples defined
    if qid not in EXAMPLES_MAP:
        # Should not happen as we covered all
        print(f"Warning: No examples found for {qid}")
        examples = ["Example answer."]
    else:
        examples = EXAMPLES_MAP[qid]
        
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        data['examples'] = examples
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            
        return True
    except Exception as e:
        print(f"Error updating {filename}: {e}")
        return False

def main():
    if not os.path.exists(QUESTIONS_DIR):
        print(f"Directory not found: {QUESTIONS_DIR}")
        return

    files = sorted([f for f in os.listdir(QUESTIONS_DIR) if f.endswith('.json')])
    print(f"Updating {len(files)} files in {QUESTIONS_DIR} with detailed examples...")
    
    count = 0
    for f in files:
        if update_file(os.path.join(QUESTIONS_DIR, f)):
            count += 1
            
    print(f"Updated {count} files with detailed examples.")

if __name__ == "__main__":
    main()
