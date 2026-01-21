
import json
import os
import glob

# Content Map: Neutralized, non-presumptuous examples
content_map = {
    "q01": [
        "Not ready (e.g., I don't feel the capacity for a relationship right now).",
        "Mostly not ready (e.g., I want to date, but have other major priorities first).",
        "Cautiously ready (e.g., I'm open to meeting people but taking it slow).",
        "Ready (e.g., I feel stable and excited to connect).",
        "Unsure (e.g., I swing between wanting connection and wanting space)."
    ],
    "q02": [
        "Most ready (e.g., I feel emotionally available).",
        "Least ready (e.g., My schedule is very full).",
        "Confidence: High (I trust myself).",
        "Urgency: Low (I'm not in a rush)."
    ],
    "q03": [
        "Stable/positive (e.g., generally happy and balanced).",
        "Stable/neutral (e.g., okay, just going through the routine).",
        "Variable (e.g., lots of ups and downs recently).",
        "Low (e.g., feeling down or drained often).",
        "Anxious (e.g., feeling worried or on edge)."
    ],
    "q04": [
        "Light (e.g., life feels manageable).",
        "Moderate (e.g., busy but I'm handling it).",
        "Heavy (e.g., under significant pressure right now).",
        "Overwhelmed (e.g., feeling buried by obligations)."
    ],
    "q05": [
        "Yes, consistently (e.g., I follow through on what I say).",
        "Mostly (e.g., I usually come through, with occasional slips).",
        "Inconsistent (e.g., I struggle to keep commitments).",
        "No (e.g., I can't take on responsibility for another right now)."
    ],
    "q06": [
        "No (e.g., feeling safe).",
        "Passive (e.g., occasional dark thoughts but no intent).",
        "Active (Please prioritize your safety and seek professional support)."
    ],
    "q07": [
        "None (e.g., I don't use substances).",
        "Occasional/Responsible (e.g., social use that doesn't impact my life).",
        "Sometimes problematic (e.g., I sometimes overdo it).",
        "In recovery (e.g., I am sober/clean)."
    ],
    "q08": [
        "Yes (e.g., my behavior aligns with my values).",
        "Mostly (e.g., minor struggles but mostly aligned).",
        "No (e.g., I feel out of control or misaligned).",
        "Working on it (e.g., taking steps to improve)."
    ],
    "q09": [
        "Top Reasons: 1) Still healing, 2) Career focus, 3) Financial stress.",
        "Top Reasons: 1) Fear of vulnerability, 2) Enjoying single life, 3) Health issues."
    ],
    "q10": [
        "Last relationship: 2 years ago. Duration: 1 year. Ended: Mutual decision.",
        "Last relationship: 6 months ago. Duration: 3 months. Ended: I ended it."
    ],
    "q11": [
        "Never married.",
        "Divorced (finalized).",
        "Divorced (in progress).",
        "Widowed.",
        "Separated."
    ],
    "q12": [
        "Neutral (e.g., I don't think about them much).",
        "Warm (e.g., we wish each other well).",
        "Sad (e.g., I still feel grief).",
        "Angry (e.g., I still feel hurt/upset).",
        "Mixed (e.g., some good days, some hard days)."
    ],
    "q13": [
        "No contact (e.g., we don't speak).",
        "Rare/Logistical (e.g., only discuss necessary business).",
        "Co-parenting (e.g., communication focused on kids).",
        "Friendly (e.g., we catch up occasionally).",
        "Frequent (e.g., we are still close friends)."
    ],
    "q14": [
        "Clean (e.g., boundaries are clear and respected).",
        "Mostly clean (e.g., occasional blurriness but mostly okay).",
        "Messy (e.g., lines are often crossed).",
        "Complex (e.g., emotional ties linger)."
    ],
    "q15": [
        "No (e.g., nothing left to resolve).",
        "Minor (e.g., some small loose ends).",
        "Moderate (e.g., some emotional entanglements remain).",
        "Major (e.g., still living together or financially tied)."
    ],
    "q16": [
        "Yes (e.g., I feel safe).",
        "Mostly (e.g., usually safe, some unease).",
        "No (Please prioritize your safety)."
    ],
    "q17": [
        "Mutual drift (e.g., we grew apart).",
        "Conflict (e.g., too much fighting).",
        "Avoidance (e.g., one or both withdrew).",
        "Betrayal (e.g., trust was broken).",
        "External factors (e.g., distance, timing)."
    ],
    "q18": [
        "I learned that I need to speak up sooner.",
        "I learned that shared values are critical.",
        "I learned to trust my intuition."
    ],
    "q19": [
        "They might say I work too much.",
        "They might say I struggle to open up.",
        "They might say I can be critical."
    ],
    "q20": [
        "In therapy (e.g., currently attending).",
        "Open (e.g., willing to go if needed).",
        "Maybe (e.g., undecided).",
        "Not open (e.g., prefer to handle things myself)."
    ],
    "q21": [
        "Not applicable.",
        "Stable (e.g., managed well).",
        "Adjusting (e.g., currently finding the right balance).",
        "Unstable (e.g., struggling with consistency)."
    ],
    "q22": [
        "Self-regulate (e.g., take a pause, breathe).",
        "Need space (e.g., take a walk, then return).",
        "Ruminate (e.g., replay thoughts).",
        "Shut down (e.g., go quiet).",
        "Pursue (e.g., want to fix it immediately)."
    ],
    "q23": [
        "Stonewalling (e.g., shutting down conversation).",
        "Defensiveness (e.g., explaining away fault).",
        "Criticism (e.g., focusing on faults).",
        "People-pleasing (e.g., agreeing to keep peace).",
        "Withdrawing (e.g., physically leaving)."
    ],
    "q24": [
        "Consistent (e.g., regular sleep schedule).",
        "Somewhat inconsistent (e.g., varies weekends vs weekdays).",
        "Poor (e.g., frequent waking or trouble sleeping)."
    ],
    "q25": [
        "No (e.g., never occurred).",
        "Yes, once (e.g., isolated incident).",
        "Yes, multiple times (e.g., has happened before)."
    ],
    "q26": [
        "No (e.g., not an issue).",
        "Mild impact (e.g., rare occurrence).",
        "Moderate impact (e.g., happens occasionally).",
        "Severe impact (e.g., feels out of control).",
        "In recovery (e.g., active in a program)."
    ],
    "q27": [
        "Examples: Therapist, Best friend, Mentor, Sibilng.",
        "Examples: Support group leader, Parent, Trusted colleague."
    ],
    "q28": [
        "Lean in (e.g., move closer).",
        "Slow down (e.g., manage the pace).",
        "Pull back (e.g., need distance).",
        "Test (e.g., check if they are serious).",
        "Overgive (e.g., try to earn their affection)."
    ],
    "q29": [
        "Secure (e.g., comfortable with intimacy and independence).",
        "Anxious (e.g., worry about connection).",
        "Avoidant (e.g., value extreme independence).",
        "Fearful/Mixed (e.g., want closeness but fear it)."
    ],
    "q30": [
        "Same day (e.g., resolve before sleeping).",
        "1-2 days (e.g., need a little time).",
        "Week (e.g., takes a while to reconnect).",
        "Rarely (e.g., we often don't resolve it)."
    ],
    "q31": [
        "Soft startup (e.g., gentle approach).",
        "Listen/Reflect (e.g., hearing them out).",
        "Argue to win (e.g., focusing on accuracy).",
        "Withdraw (e.g., stepping back).",
        "Repair attempts (e.g., humor or apology)."
    ],
    "q32": [
        "Stay honest (e.g., speak truth despite fear).",
        "Manage image (e.g., trying to look 'good').",
        "Overpromise (e.g., agreeing to too much).",
        "Detach (e.g., acting like I don't care)."
    ],
    "q33": [
        "Strong (e.g., clear and consistent).",
        "Okay (e.g., I can do it but it's hard).",
        "Weak (e.g., I often give in).",
        "Unsure (e.g., not sure where my lines are)."
    ],
    "q34": [
        "Top Patterns: 1) Over-giving, 2) Ignoring flags, 3) Moving fast.",
        "Top Patterns: 1) Avoidance, 2) Shutting down, 3) Leaving early."
    ],
    "q35": [
        "Neutral (e.g., assume they are busy).",
        "Mild worry (e.g., notice it but stay calm).",
        "Rejection (e.g., assume they lost interest).",
        "Text more (e.g., try to get a response)."
    ],
    "q36": [
        "Importance: Central. Tradition: Christian. Community: Active.",
        "Importance: Important. Tradition: LDS. Community: Occasional.",
        "Importance: Minimal. Tradition: Spiritual/None."
    ],
    "q37": [
        "Clarity: Aligned (e.g., reliable follow-through).",
        "Clarity: Struggling (e.g., hard to maintain).",
        "Clarity: Unclear (e.g., still deciding)."
    ],
    "q38": [
        "Goal: Marriage. Timeline: 1-2 years.",
        "Goal: Partnership. Timeline: Open.",
        "Goal: Exploring. Timeline: No rush."
    ],
    "q39": [
        "Aligned (e.g., actions match values).",
        "Mostly aligned (e.g., generally consistent).",
        "Misaligned (e.g., struggle to live values).",
        "Repairing (e.g., working to get back on track)."
    ],
    "q40": [
        "Top 5: 1) Faith, 2) Kindness, 3) Communication, 4) Finances, 5) Family.",
        "Top 5: 1) Integrity, 2) Humor, 3) Stability, 4) Chemistry, 5) Growth."
    ],
    "q41": [
        "Ignored values mismatch because chemistry was strong.",
        "Ignored financial chaos because they were fun.",
        "Ignored lack of ambition because they were kind."
    ],
    "q42": [
        "Preparation (e.g., focusing on self).",
        "Light/Social (e.g., meeting people casually).",
        "Intentional (e.g., dating with purpose).",
        "Serious (e.g., looking for commitment)."
    ],
    "q43": [
        "Early: Date one person. Max: 1.",
        "Early: Date a few casually. Max: 3.",
        "Early: Open-ended."
    ],
    "q44": [
        "Low-key (e.g., walk, coffee).",
        "Activity (e.g., hike, game, event).",
        "Dinner (e.g., sit-down meal).",
        "Group (e.g., with friends)."
    ],
    "q45": [
        "Light (e.g., occasional texts).",
        "Daily (e.g., once a day check-in).",
        "Frequent (e.g., ongoing conversation).",
        "Minimal (e.g., mostly logistics)."
    ],
    "q46": [
        "Conservative (e.g., minimal touch early on).",
        "Moderate (e.g., some affection, clear limits).",
        "Affectionate (e.g., touch is important)."
    ],
    "q47": [
        "Risk: Medium. Support: Date structure.",
        "Risk: High. Support: Accountability partner.",
        "Risk: Low. Support: None needed."
    ],
    "q48": [
        "Kindness/Character.",
        "Confidence/Strength.",
        "Chemistry/Attraction.",
        "Faith/Values.",
        "Stability/Provision."
    ],
    "q49": [
        "No.",
        "Yes (Primary custody).",
        "Yes (Shared custody).",
        "Yes (Adult children)."
    ],
    "q50": [
        "State: Healthy. Impact: minimal.",
        "State: Tense. Impact: requires scheduling flexibility.",
        "State: High conflict. Impact: significant stress.",
        "State: N/A."
    ],
    "q51": [
        "0 times/week (e.g., currently busy).",
        "1 time/week (e.g., weekends only).",
        "2-3 times/week.",
        "4+ times/week (e.g., flexible schedule)."
    ],
    "q52": [
        "Stable (e.g., bills paid, some savings).",
        "Some stress (e.g., tight but manageable).",
        "Unstable (e.g., significant financial pressure)."
    ],
    "q53": [
        "Predictable (e.g., standard hours).",
        "Somewhat predictable (e.g., shifts vary but known).",
        "Chaotic (e.g., frequent changes/travel)."
    ],
    "q54": [
        "No (e.g., good health).",
        "Yes, managed (e.g., chronic condition that is under control).",
        "Yes, unmanaged (e.g., health is a major challenge right now)."
    ],
    "q55": [
        "Constraints: 50/50 custody schedule.",
        "Constraints: Cannot relocate due to work.",
        "Constraints: Night shift work schedule."
    ],
    "q56": [
        "Act (e.g., make a plan to address it).",
        "Think (e.g., reflect on it but wait to act).",
        "Defend (e.g., feel the need to explain it).",
        "Avoid (e.g., try not to focus on it)."
    ],
    "q57": [
        "Style: Direct. Trigger: condescension.",
        "Style: Gentle. Trigger: public criticism.",
        "Style: Written. Trigger: feeling rushed."
    ],
    "q58": [
        "Top 5: 1) Emotional regulation, 2) Boundaries, 3) Communication, 4) Self-worth, 5) Life stability.",
        "Top 5: 1) Spiritual practice, 2) Conflict repair, 3) Health, 4) Social skills, 5) Closure."
    ],
    "q59": [
        "Plan: Read one book on attachment, Journal weekly.",
        "Plan: Join a social group, Discuss goals with a mentor."
    ],
    "q60": [
        "I need time to open up.",
        "I value directness.",
        "I am sensitive to criticism.",
        "I process things internally first."
    ],
    "q61": [
        "Serial monogamy (e.g., jumping from one to next).",
        "Long gaps (e.g., years between partners).",
        "Situationships (e.g., undefined connections).",
        "Avoidance (e.g., rarely dating)."
    ],
    "q62": [
        "Slowly (e.g., takes time to build feelings).",
        "Moderately (e.g., steady pace).",
        "Fast (e.g., attach quickly).",
        "Varies (e.g., depends on the person)."
    ],
    "q63": [
        "Not at all (e.g., feeling stable).",
        "Mildly (e.g., occasional bad days).",
        "Moderately (e.g., affects daily life sometimes).",
        "Severely (e.g., significant struggle right now)."
    ],
    "q64": [
        "No (e.g., no known trauma).",
        "Yes, addressed (e.g., processed in therapy).",
        "Yes, partially (e.g., working on it).",
        "Yes, unaddressed (e.g., haven't started processing)."
    ],
    "q65": [
        "Triggers: Yelling, Silence. Soothing: Walking away, Music.",
        "Triggers: Criticism, Lateness. Soothing: Reassurance, Space."
    ],
    "q66": [
        "Direct (e.g., state needs clearly).",
        "Indirect (e.g., hint or imply).",
        "Avoidant (e.g., stay silent to keep peace).",
        "Overexplain (e.g., talk a lot to clarify)."
    ],
    "q67": [
        "Rare (e.g., generally trust).",
        "Sometimes (e.g., occasional insecurity).",
        "Often (e.g., frequent worry).",
        "Problematic (e.g., affects behavior)."
    ],
    "q68": [
        "Very comfortable (e.g., can ask easily).",
        "Somewhat comfortable (e.g., depends on topic).",
        "Hard (e.g., struggle to ask).",
        "Very hard (e.g., usually don't ask)."
    ],
    "q69": [
        "Well: Owning it. Miss: Changing behavior.",
        "Well: Empathy. Miss: Getting defensive."
    ],
    "q70": [
        "Practices: Prayer, Meditation.",
        "Practices: Nature, Journaling.",
        "Practices: Worship, Service."
    ],
    "q71": [
        "Strict abstinence (e.g., waiting for marriage).",
        "Abstinence w/ gray (e.g., some affection ok).",
        "Discerning (e.g., still deciding).",
        "Open (e.g., physical connection is key)."
    ],
    "q72": [
        "Dealbreakers: Different faith, Hostility to religion.",
        "Dealbreakers: None (open to all)."
    ],
    "q73": [
        "Agree (e.g., go along with it).",
        "Slow down (e.g., ask for time).",
        "Walk away (e.g., feel pressured).",
        "Confused (e.g., unsure what to do)."
    ],
    "q74": [
        "Hold boundary (e.g., say no).",
        "Cave (e.g., give in).",
        "Freeze (e.g., go silent).",
        "End it (e.g., leave the situation)."
    ],
    "q75": [
        "Slower pace.",
        "Clearer intentions.",
        "Stronger boundaries.",
        "Better filters.",
        "Healthier communication."
    ],
    "q76": [
        "No (e.g., established here).",
        "Maybe (e.g., regional move).",
        "Yes (e.g., open to anywhere)."
    ],
    "q77": [
        "Low (e.g., manageable payments).",
        "Moderate (e.g., some debt but paying it).",
        "High (e.g., significant financial stress)."
    ],
    "q78": [
        "Rhythm: Work M-F, Free weekends.",
        "Rhythm: Shift work, free mornings.",
        "Rhythm: Kids week on/off, varying availability."
    ],
    "q79": [
        "Very willing (e.g., prefer directness).",
        "Willing (e.g., will do it if needed).",
        "Reluctant (e.g., prefer to wait).",
        "Avoid (e.g., skip hard topics)."
    ],
    "q80": [
        "Green flags: Loyal, Stable, Kind, Honest.",
        "Green flags: Growth-oriented, Generous, Self-aware."
    ],
    "q81": [
        "Red flags: Avoidant, Short temper.",
        "Red flags: Jealousy, Passive-aggressive."
    ],
    "q82": [
        "Rules: Honest about feelings, Support system in place, Not rushing.",
        "Rules: Past relationship fully closed, Emotional availability."
    ]
}

questions_dir = r"c:\Users\Roy\Desktop\AI\Slow-Build-Check-In\data\phase_0\questions"
question_files = glob.glob(os.path.join(questions_dir, "q*.json"))

print(f"Starting update for {len(question_files)} files...")

for file_path in question_files:
    filename = os.path.basename(file_path)
    # filename is like "q01.json"
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
            
    # Check compound fields for answer_schema structure
    # Note: 'compound' type questions have a different schema structure usually, 
    # but the root AnswerSchema usually has keys matching the fields. 
    # Some compound questions might already have a 'notes' field in their 'fields' list.
    # We should ensure the output schema supports it.
    
    # Save back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
print("Update complete.")
