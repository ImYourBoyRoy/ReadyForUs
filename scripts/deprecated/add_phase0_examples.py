# ./scripts/add_phase0_examples.py
"""
Add examples to all Phase 0 questions that are missing them.
Examples are derived from available options and written for the pre-dating readiness context.
"""
import json

# Define examples for each question based on their type and available options
EXAMPLES = {
    "q02": ["Reasons ranked: 1) I desire marriage/family, 2) I feel emotionally ready, 3) I want companionship. Urgency: 5. Confidence: 7."],
    "q03": ["Stable/neutral - I feel okay most days, with occasional dips."],
    "q04": ["Moderate - my schedule is full but manageable."],
    "q05": ["Mostly, with occasional strain - I can usually show up but need to be intentional about it."],
    "q06": ["No."],
    "q07": ["Occasional and responsible."],
    "q08": ["Mostly, with some struggle - I'm working on this area but not perfect."],
    "q10": ["Months since last major: 8. Last major length: 24 months. Longest relationship: 36 months."],
    "q11": ["Never married."],
    "q12": ["Mostly, with some unfinished pieces."],
    "q13": ["A few times per month."],
    "q14": ["Friendly occasional contact only."],
    "q15": ["Some text/calls, gradually decreasing."],
    "q16": ["No comparison trap - I see them as a different chapter."],
    "q17": ["I've named my patterns and am actively working on them."],
    "q18": ["Solid - I can name what happened and what I'd do differently."],
    "q19": ["Yes, with help - therapy, support group, or mentor."],
    "q20": ["No - clean break on all platforms."],
    "q21": ["Multiple - therapist, close friends, family."],
    "q22": ["3,5 - 3-5 reliable people. Most important: close friend who knows my story."],
    "q23": ["Overeating, withdrawal from social activities."],
    "q24": ["Usually, within a few hours."],
    "q25": ["1-2 times this month, briefly."],
    "q26": ["Yes, I have tools: breathing, journaling, calling a friend."],
    "q27": ["Solid most days - I generally manage stress well."],
    "q28": ["Mostly, with awareness - I know I can slip when triggered but I'm working on it."],
    "q29": ["Secure-leaning: I can be close without losing myself."],
    "q30": ["Mostly secure - I sometimes worry but can self-regulate."],
    "q31": ["Address it soon/directly, talk through it calmly."],
    "q32": ["Accept responsibility, apologize genuinely, make amends."],
    "q33": ["Gentle feedback lands better - both direct and kind."],
    "q34": ["I tend to over-give early on. I'm learning to pace myself."],
    "q35": ["Both - I value independence but also deep partnership."],
    "q36": ["Practice - I want to grow. Core values: faith, family, integrity."],
    "q37": ["Somewhat involved - occasional church attendance or personal practice."],
    "q38": ["Yes - faith/values alignment is important to me."],
    "q39": ["Yes, I can date someone with different views if they respect mine."],
    "q40": ["Top 5: 1) Kindness/respect, 2) Emotional maturity, 3) Communication, 4) Shared faith, 5) Financial responsibility."],
    "q41": ["I've ignored misaligned values for chemistry. Working on holding my standards."],
    "q42": ["Long-term: I'm looking for something that could lead to commitment."],
    "q43": ["Slow pace, get to know each other: I want to build trust before deepening."],
    "q44": ["Exclusive once committed."],
    "q45": ["By date 3-5: basic life story, values, deal-breakers. Full vulnerability comes later."],
    "q46": ["Weekly or bi-weekly: enough to build momentum without overwhelm."],
    "q47": ["1-2 months: enough time to see patterns and consistency."],
    "q48": ["Hugs, hand-holding, light touch: affection should grow with trust."],
    "q49": ["5-10 hours per week."],
    "q50": ["Evenings free: 3-4 nights per week. Weekends: mostly available."],
    "q51": ["Moderate flexibility: can adjust with notice."],
    "q52": ["No dependents at home."],
    "q53": ["Within 30 minutes: close enough for easy dates."],
    "q54": ["Stable and manageable: not a barrier to dating."],
    "q55": ["Stable housing: living independently."],
    "q56": ["Therapy and personal reflection."],
    "q57": ["Ask someone who saw me: a trusted friend or mentor."],
    "q59": ["Week 1: Start journaling about patterns. Week 2: Reach out to one close friend. Week 3-4: Set one boundary I've been avoiding."],
    "q60": ["Self-honesty, healthy conflict skills, knowing my worth."],
    "q61": ["Ended it myself: I initiated the breakup."],
    "q62": ["Mostly relieved with some sadness."],
    "q63": ["3 months ago - I'm past the acute phase."],
    "q64": ["Moderate - not major but still processing."],
    "q65": ["Not diagnosed or unsure."],
    "q66": ["Name the emotion but not always regulate it quickly."],
    "q67": ["I sometimes freeze or avoid confrontation."],
    "q68": ["Unspoken expectations - when they aren't clear, I make assumptions."],
    "q69": ["Honest but avoidant - I'll be truthful but might delay hard conversations."],
    "q70": ["Prayer, Scripture reading."],
    "q71": ["Very important - I want to share this with a partner."],
    "q72": ["Same faith tradition: we share the same beliefs."],
    "q73": ["Very flexible: I can move quickly or slowly depending on connection."],
    "q74": ["Talk about it openly before becoming physical."],
    "q75": ["More communication early, clearer boundaries."],
    "q76": ["Yes, but with conditions: distance or schedule constraints."],
    "q77": ["Need to feel emotionally safe and sure before introducing family."],
    "q78": ["Unsure - it depends on how things develop."],
    "q79": ["Direct and honest: tell me what you see, even if it's hard."],
    "q80": ["High commitment: I'll do the work, I want to grow."],
    "q81": ["Read a book on attachment, practice active listening this month."],
    "q82": ["I'm ready when: I can be honest about my patterns, I have support, I'm not running from something."]
}

def main():
    with open('data/phase_0/questions.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated = 0
    for qid, examples in EXAMPLES.items():
        if qid in data['questions']:
            current = data['questions'][qid].get('examples', [])
            if not current or all(e.strip() == '' for e in current):
                data['questions'][qid]['examples'] = examples
                updated += 1
                print(f"Added example to {qid}: {data['questions'][qid].get('title', '')}")
            else:
                print(f"Skipped {qid}: already has examples")
    
    with open('data/phase_0/questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated {updated} questions with examples.")

if __name__ == '__main__':
    main()
