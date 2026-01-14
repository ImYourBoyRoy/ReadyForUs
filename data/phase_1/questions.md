# Phase 1: Early Connection Check-In

## Purpose

**"Are we on the same page before we commit to committing?"**

This questionnaire is for two people who:

- Matched on a dating app and conversations are going well
- Have been on 1-3 dates and want to explore if there's real potential
- Have known each other briefly and expressed mutual interest
- Want to see where their weaknesses, fears, triggers, and insecurities are before going deeper

---

## Sections Overview

| #  | Section Title                          | Focus                                             | Lite | Full |
|----|----------------------------------------|---------------------------------------------------|------|------|
| S1 | Starting Point                         | Single status, ex-closure, current situation      | 4    | 5    |
| S2 | Why This Person, Why Now               | Attraction, motivation, pursuit balance           | 4    | 5    |
| S3 | Hard Truths & Dealbreakers             | Porn, addictions, dealbreakers, intimacy timeline | 4    | 6    |
| S4 | How I Show Up When It's Hard           | Conflict style, stress response, blind spots      | 3    | 4    |
| S5 | Attachment & Emotional Needs           | Bonding speed, reassurance needs, fears           | 2    | 4    |
| S6 | Communication & Conflict               | Hard conversations, feedback, avoidance topics    | 3    | 4    |
| S7 | Values & Faith Alignment               | Core values, faith profile, non-negotiables       | 3    | 5    |
| S8 | Expectations & Pacing                  | Dating goals, exclusivity, physical timeline      | 2    | 4    |
| S9 | Life Logistics Reality                 | Kids, time, finances, major constraints           | 2    | 4    |
| S10| Growth & Self-Awareness                | Working on, what they need to know                | 2    | 3    |
| S11| Where We Stand                         | Readiness rating, hopes, exit wisdom              | 2    | 3    |
| **TOTAL** |                                   |                                                   | **31** | **47** |

---

## Section 1: Starting Point

> *Re-verify critical Phase 0 gatekeepers in the context of exploring a connection with someone.*

### Q01 [LITE] — Current Relationship Status

**Type**: single_select  
**Prompt**: "To be fully honest right here: Are you completely single right now—legally, emotionally, and in your heart?"

**Options**:

- `yes_completely`: "Yes—no marriage, separation, or complicated situation"
- `separated_not_final`: "Separated but not legally finalized"
- `complicated`: "It's complicated (there's overlap I should explain)"
- `widowed_recent`: "Widowed (still processing loss)"
- `prefer_not`: "Prefer not to say"
- `other`: "Other (write in)"

**Examples**:

- "Yes—divorced 2 years ago, no lingering entanglement."
- "Separated, divorce will be finalized in 2 months."

---

### Q02 [LITE] — Time Since Last Major Relationship

**Type**: compound  
**Prompt**: "Give me a quick snapshot of your relationship history—this helps us understand where you're coming from."

**Fields**:

1. `months_since_end` (number, 0-600): "Months since your last major relationship ended"
2. `what_defines_major` (short_text): "What makes a relationship 'major' to you? (1 sentence)"
3. `how_it_ended` (single_select):
   - `mutual_healthy`: "Mutual and healthy"
   - `painful_but_clean`: "Painful but clean break"
   - `messy_unresolved`: "Messy or unresolved"
   - `abandoned`: "I was left unexpectedly"
   - `widowed`: "Widow/er"
   - `other`: "Other"
4. `notes` (free_text, optional): "Anything that affects how you're entering this?"

**Examples**:

- "8 months since last major. Major = emotional investment + exclusivity. It ended mutually."

---

### Q03 [LITE] — Ex Entanglement Check

**Type**: compound  
**Prompt**: "If you're being completely honest with yourself: Is there any ongoing connection with an ex (or someone else) that could affect your availability to show up fully in this?"

**Fields**:

1. `entanglement_level` (single_select):
   - `none`: "No—total clean break"
   - `logistical_only`: "Logistical only (co-parenting, shared finances)"
   - `occasional_friendly`: "Occasional friendly contact (healthy)"
   - `still_processing`: "Still emotionally processing them"
   - `ongoing_contact`: "Ongoing emotional/physical contact"
   - `unsure`: "Unsure"
   - `prefer_not`: "Prefer not to say"
2. `would_partner_worry` (single_select):
   - `no`: "No—they'd have no reason to"
   - `maybe_need_context`: "Maybe—but I can explain"
   - `yes_honestly`: "Yes—this needs work"
3. `notes` (short_text, optional): "Briefly explain if needed"

**Examples**:

- "Occasional friendly contact. Partner would have no reason to worry—we're firmly in friend zone."
- "Still processing emotionally. They'd probably need context and reassurance."

---

### Q04 [LITE] — Emotional Closure

**Type**: single_select  
**Prompt**: "When you think about your most recent ex, what's the dominant feeling that comes up—even if it's subtle?"

**Options**:

- `neutral_at_peace`: "Neutral / at peace"
- `warm_grateful`: "Warm / grateful for what we had"
- `sad_grief`: "Sad / grief (but processing)"
- `angry_resentful`: "Angry / resentful"
- `longing_attachment`: "Longing / attachment"
- `relief`: "Relief (glad it's over)"
- `mixed`: "Mixed feelings"
- `numb`: "Numb / disconnected"
- `prefer_not`: "Prefer not to say"
- `other`: "Other (write in)"

**Examples**:

- "Warm/grateful—I learned a lot even though it ended."
- "Mixed—some days fine, some days harder."

---

### Q05 [FULL] — Relational Safety

**Type**: single_select  
**Prompt**: "Right now, do you feel physically and emotionally safe from any current partner, ex, or person you're dating? (No harassment, threats, stalking, or control.)"

**Options**:

- `yes`: "Yes—completely safe"
- `mostly`: "Mostly—some concerns but not afraid"
- `no`: "No—I feel unsafe, pressured, or threatened"
- `unsure`: "Unsure"
- `prefer_not`: "Prefer not to say"

**Examples**:

- "Yes—completely safe."

---

## Section 2: Why This Person, Why Now

> *Understanding motivation and attraction patterns. Do you know why you're drawn to them—really?*

### Q06 [LITE] — What Drew You to Them

**Type**: compound  
**Prompt**: "What specifically drew you to this person? (Not just 'we matched' or 'they're attractive.' Be honest about both the surface-level and the deeper pull.)"

**Fields**:

1. `primary_pull` (single_select): "The primary thing that drew you in"
   - `emotional_safety`: "They feel emotionally safe / stable"
   - `chemistry`: "Strong chemistry / physical attraction"
   - `shared_values`: "Shared values or faith alignment"
   - `familiarity_pattern`: "Familiar pattern (reminds me of someone)"
   - `timing_loneliness`: "Good timing / I was ready / lonely"
   - `curiosity_potential`: "Genuine curiosity about who they are"
   - `they_pursued_me`: "They pursued me and it felt good"
   - `other`: "Other (write in)"
2. `explanation` (free_text): "Describe what drew you in—both surface-level and deeper"
3. `pattern_awareness` (single_select): "Does this attraction feel familiar in concerning ways?"
   - `no_feels_new`: "No—this feels different/healthy"
   - `somewhat_watching`: "Somewhat—I'm watching it"
   - `yes_aware`: "Yes—I see a pattern I'm trying not to repeat"
   - `unsure`: "Unsure"

**Examples**:

- "Primary: emotional safety. They follow through consistently. Pattern: No—this feels different from my usual type."

---

### Q07 [LITE] — Honest Motivation Check

**Type**: compound  
**Prompt**: "What's really pulling you toward exploring this right now? Select and rank your top reasons—be honest, even if some of them aren't 'noble.'"

**Fields**:

1. `reasons_ranked` (ranked_select, max 5):
   - `genuine_connection`: "Genuine connection and curiosity"
   - `values_alignment`: "We seem aligned on important things"
   - `physical_attraction`: "Physical attraction is strong"
   - `loneliness_relief`: "I'm lonely and want relief"
   - `ready_for_partnership`: "I feel ready for real partnership"
   - `fear_running_out_time`: "Fear of running out of time (age, kids, life stage)"
   - `proving_something`: "Proving something to myself or someone else"
   - `distraction_from_pain`: "Distraction from pain, grief, or boredom"
   - `they_pursued_me`: "They pursued me and it felt good"
   - `dont_want_to_be_alone`: "I just don't want to be alone"
   - `other`: "Other (write in)"
2. `urgency_level` (number, 0-10): "How urgent does exploring this feel right now?"
3. `confidence_healthy` (number, 0-10): "How confident are you that your motivation is healthy?"
4. `notes` (free_text, optional): "Anything you want to acknowledge here?"

**Examples**:

- "Top: 1) Genuine connection, 2) Ready for partnership, 3) Physical attraction. Urgency: 6. Confidence: 7."

---

### Q08 [LITE] — If This Doesn't Work Out

**Type**: single_select  
**Prompt**: "If this doesn't work out, what's your honest, likely reaction? (Not how you want to react—how you probably would.)"

**Options**:

- `move_on_gracefully`: "I'd process it and move on gracefully"
- `disappointed_but_okay`: "Disappointed but okay"
- `take_it_hard`: "I'd take it pretty hard"
- `crushed_spiral`: "I'd be crushed / might spiral a bit"
- `relieved`: "Honestly, I might be relieved"
- `depends_on_how`: "It depends entirely on how it ends"
- `unsure`: "I'm not sure"
- `other`: "Other (write in)"

**Examples**:

- "Disappointed but okay—I've built enough resilience from past letdowns."

---

### Q09 [LITE] — Early Momentum Check

**Type**: single_select  
**Prompt**: "Right now, who seems more invested or leaning in? (This affects pacing and expectations—be honest.)"

**Options**:

- `about_equal`: "About equal"
- `me_bit_more`: "Me a bit more"
- `them_bit_more`: "Them a bit more"
- `me_significantly`: "Me significantly more"
- `them_significantly`: "Them significantly more"
- `hard_to_tell`: "Hard to tell"
- `changes_daily`: "It changes day to day"

**Examples**:

- "Me a bit more—I'm initiating more, but they're responsive."
- "About equal—we're both putting in similar effort."

---

### Q10 [FULL] — Pattern Recognition

**Type**: free_text  
**Prompt**: "What pattern from your past relationships might show up here? (The one you keep repeating even though you know better.)"

**Examples**:

- "I tend to over-give early, trying to earn their interest. Then I resent it later."
- "I go quiet when I'm hurt instead of speaking up—and then it builds."

---

## Section 3: Hard Truths & Dealbreakers

> *The uncomfortable stuff that should come out early. This is about integrity and honesty—for yourself and for them.*

### Q11 [LITE] — Dealbreakers You Need to Know

**Type**: compound  
**Prompt**: "What are your absolute non-negotiables—things about them that would end this before it starts? Select and rank your top 5."

**Fields**:

1. `dealbreakers_ranked` (ranked_select, max 5):
   - `active_addiction`: "Active addiction (substances, porn, gambling)"
   - `dishonesty`: "Dishonesty / lying"
   - `still_married`: "Still legally married"
   - `no_faith_alignment`: "Faith/values misalignment"
   - `no_emotional_availability`: "Emotional unavailability"
   - `abuse_history`: "History of abuse (as perpetrator)"
   - `financial_disaster`: "Major financial irresponsibility"
   - `kids_mismatch`: "Kids situation doesn't match mine"
   - `no_desire_commitment`: "No desire for commitment"
   - `poor_mental_health_untreated`: "Untreated mental health issues"
   - `distance`: "Distance / unable to relocate"
   - `other`: "Other (write in)"
2. `other_text` (short_text, showWhen other): "Describe your 'other' dealbreaker"
3. `notes` (free_text, optional): "Why are these your top concerns?"

**Examples**:

- "Top 5: 1) Active addiction, 2) Dishonesty, 3) Still married, 4) No commitment desire, 5) Faith mismatch"

---

### Q12 [LITE] — Things You Should Disclose

**Type**: multi_select  
**Prompt**: "Of the following, which apply to you right now? (This isn't about shame—it's about giving someone the chance to accept the real you.)"

**Options** (max 10):

- `porn_struggle`: "Current struggle with pornography"
- `significant_debt`: "Significant debt"
- `mental_health_active`: "Active mental health challenge (anxiety, depression, etc.)"
- `addiction_recovery`: "In recovery from addiction"
- `past_infidelity`: "History of infidelity"
- `std_disclosure`: "STD/STI that requires disclosure"
- `kids_they_dont_know`: "Children they may not know about"
- `legal_issues`: "Ongoing legal or criminal issues"
- `chronic_illness`: "Chronic health condition"
- `trauma_affects_intimacy`: "Trauma that affects intimacy or trust"
- `none`: "None of these apply"
- `prefer_not`: "Prefer not to say"
- `other`: "Other (write in)"

**Examples**:

- "Mental health (anxiety, managed with therapy). Trauma that affects intimacy."

---

### Q13 [LITE] — Sexual Integrity Check

**Type**: compound  
**Prompt**: "Being honest with yourself: Are you currently living in alignment with your own values around sexual integrity?" *(This adapts to your faith context—we're not here to judge, just to help you be honest with yourself.)*

**Fields**:

1. `faith_context` (single_select):
   - `lds`: "Latter-day Saint (LDS)"
   - `christian`: "Christian (non-LDS)"
   - `faith_based_values`: "Faith-based values (other tradition)"
   - `personal_values`: "Personal values (not religious)"
   - `no_strong_standard`: "I don't have a strong standard on this"
   - `prefer_not`: "Prefer not to say"
2. `current_alignment` (single_select):
   - `yes_aligned`: "Yes—I'm living in alignment"
   - `mostly_struggling`: "Mostly—but I struggle sometimes"
   - `no_working_on_it`: "No—but I'm actively working on it with support"
   - `no_not_working`: "No—and I'm not actively addressing it"
   - `unsure`: "Unsure what my standard even is"
   - `prefer_not`: "Prefer not to say"
3. `support_in_place` (short_text, optional): "If you're working on this, what support do you have?"
4. `notes` (free_text, optional): "Anything you want to add (kept confidential)"

**Examples**:

- "LDS. Mostly aligned—I struggle with pornography occasionally but have a therapist and accountability partner."

---

### Q14 [LITE] — Intimacy Timeline Expectations

**Type**: compound  
**Prompt**: "For physical intimacy, what's your honest expectation or boundary at this stage?"

**Fields**:

1. `physical_boundary` (single_select):
   - `waiting_marriage`: "Waiting for marriage"
   - `waiting_commitment`: "Waiting for serious commitment/exclusivity"
   - `slow_gradual`: "Slow and gradual as trust builds"
   - `no_strong_timeline`: "No strong timeline—going with the flow"
   - `open_to_sooner`: "Open to sooner if it feels right"
   - `prefer_not`: "Prefer not to say"
2. `what_helps_me_feel_safe` (short_text): "What would help you feel safe and respected in this area?"
3. `notes` (free_text, optional): "Anything else to share?"

**Examples**:

- "Waiting for serious commitment. Helps me feel safe: explicit conversation before any escalation."

---

### Q15 [FULL] — Pornography & Compulsive Behavior

**Type**: single_select  
**Prompt**: "Does pornography or compulsive sexual behavior currently affect your ability to date with integrity?"

**Options**:

- `no`: "No—this isn't an issue for me"
- `mild`: "Mild impact (occasional struggle)"
- `moderate`: "Moderate impact (recurring pattern)"
- `severe`: "Severe impact (secretive, escalating, or compulsive)"
- `in_recovery`: "In recovery with support systems"
- `prefer_not`: "Prefer not to say"
- `other`: "Other (write in)"

---

### Q16 [FULL] — What You're Hesitant to Share

**Type**: free_text  
**Prompt**: "Is there anything you know you should probably share with this person at some point—but you're hesitant to? (You don't have to share it here, just acknowledge it to yourself.)"

**Examples**:

- "My divorce involved infidelity on my part. I've done a lot of work, but they deserve to know eventually."
- "I have more debt than people might assume. It's manageable but should be disclosed."

---

## Section 4: How I Show Up When It's Hard

> *The truth about how you handle difficulty. These questions are designed to surface what partners actually experience.*

### Q17 [LITE] — When You Feel Rejected or Dismissed

**Type**: compound  
**Prompt**: "When you feel rejected, dismissed, or like you're not a priority—what do you actually do? (Not what you wish you did.)"

**Fields**:

1. `reaction_pattern` (multi_select, max 3):
   - `withdraw_go_quiet`: "Withdraw / go quiet"
   - `seek_reassurance`: "Seek reassurance (text more, ask questions)"
   - `get_sharp_defensive`: "Get sharp or defensive"
   - `people_please`: "People-please / try harder"
   - `act_like_dont_care`: "Act like I don't care (mask it)"
   - `catastrophize`: "Catastrophize / assume the worst"
   - `test_them`: "Test them to see if they'll pursue"
   - `talk_it_out_directly`: "Ask to talk about it directly"
   - `other`: "Other (write in)"
2. `recovery_time` (single_select):
   - `quickly`: "Quickly (minutes to hours)"
   - `moderate`: "Takes a bit (up to a day)"
   - `long`: "Takes me a while (days)"
   - `lingers`: "It lingers and affects me for a while"
3. `what_would_help` (short_text): "What response from them would actually help?"

**Examples**:

- "I go quiet and act like I don't care. Takes me a day. Helps: gentle check-in without pressure."

---

### Q18 [LITE] — When You're Stressed

**Type**: compound  
**Prompt**: "When you're stressed (work, life, overwhelm), how do you treat the people closest to you? Be honest."

**Fields**:

1. `stress_behavior` (single_select):
   - `withdraw_need_space`: "Withdraw / need space"
   - `get_snappy_irritable`: "Get snappy or irritable"
   - `lean_in_need_support`: "Lean in / need more connection"
   - `shut_down_numb`: "Shut down / go numb"
   - `stay_pretty_stable`: "Stay pretty stable"
   - `overfunction`: "Overfunction / take over"
   - `other`: "Other (write in)"
2. `what_they_should_know` (short_text): "What should someone close to you know about stressed-you?"
3. `warning_signs` (short_text, optional): "Early warning signs that you're reaching capacity?"

**Examples**:

- "I get snappy and need space. Warning signs: I get short in my texts. What helps: give me an hour, then reconnect gently."

---

### Q19 [LITE] — What Your Ex Would Say

**Type**: free_text  
**Prompt**: "If I asked your ex (or someone who's been close to you) what was the hardest part about being with you—what would they honestly say?"

**Examples**:

- "That I need a lot of reassurance and can come across as insecure."
- "That I shut down instead of talking about what's bothering me."
- "That I'm too focused on work and they felt like a lesser priority."

---

### Q20 [FULL] — A Behavior You've Been Told Is Hurtful

**Type**: free_text  
**Prompt**: "Is there a behavior you've been told hurts people—but you struggle to change? (Not looking for perfection, just honesty.)"

**Examples**:

- "I interrupt when I'm excited. I know it makes people feel unheard."
- "I give unsolicited advice instead of just listening."

---

### Q21 [FULL] — Disappointment Response

**Type**: single_select  
**Prompt**: "When someone doesn't meet your expectations, how do you typically respond?"

**Options**:

- `communicate_directly`: "I communicate directly and kindly"
- `hint_expect_them_to_notice`: "I hint and expect them to notice"
- `hold_it_in_resent_later`: "I hold it in and it turns to resentment"
- `lower_expectations_move_on`: "I lower my expectations and move on"
- `get_critical_vocal`: "I get critical or vocal about it"
- `withdraw_pull_back`: "I withdraw / emotionally pull back"
- `depends_on_situation`: "Depends on the situation"
- `other`: "Other (write in)"

---

## Section 5: Attachment & Emotional Needs

> *How you bond, what triggers you to pull back, and what you need to feel secure.*

### Q22 [LITE] — Emotional Bonding Speed

**Type**: compound  
**Prompt**: "How quickly do you tend to bond emotionally? And what causes you to pull back?"

**Fields**:

1. `bonding_speed` (single_select):
   - `very_quickly`: "Very quickly—I attach fast"
   - `moderately`: "Moderately—takes a few weeks/months"
   - `slowly`: "Slowly—I take my time"
   - `depends_on_person`: "Depends on the person"
   - `unsure`: "I'm not sure"
2. `what_causes_pullback` (multi_select, max 3):
   - `intensity_too_fast`: "Too much intensity too fast"
   - `inconsistency`: "Inconsistency (mixed signals)"
   - `fear_of_losing_self`: "Fear of losing myself"
   - `past_hurt_activates`: "Past hurt getting activated"
   - `they_pull_back_first`: "They pull back first"
   - `nothing_usually`: "Nothing usually causes me to pull back"
   - `other`: "Other (write in)"
3. `notes` (free_text, optional): "Anything else to know about your bonding pattern?"

**Examples**:

- "I bond moderately—a few weeks. I pull back if there's inconsistency or too much intensity."

---

### Q23 [LITE] — Reassurance Needs

**Type**: compound  
**Prompt**: "What does reassurance look like for you? And how often do you need it to feel secure?"

**Fields**:

1. `reassurance_forms` (multi_select, max 4):
   - `clear_words`: "Clear words ('I like you, I'm here')"
   - `consistent_contact`: "Consistent contact"
   - `concrete_plans`: "Making plans together"
   - `physical_affection`: "Physical affection"
   - `transparency`: "Transparency about what's going on"
   - `quality_time`: "Dedicated quality time"
   - `acts_of_service`: "Acts of service / thoughtfulness"
   - `other`: "Other (write in)"
2. `frequency_needed` (single_select):
   - `minimal`: "Minimal—I'm fairly secure"
   - `moderate`: "Moderate—check-ins help"
   - `regular`: "Regular—I need it fairly often"
   - `depends`: "Depends on the stage / my stress level"
3. `notes` (short_text, optional): "What doesn't work for you?"

**Examples**:

- "Clear words + consistent contact. Moderate frequency. Doesn't work: vague reassurance without action."

---

### Q24 [FULL] — When Someone Gets Close

**Type**: single_select  
**Prompt**: "When someone starts getting closer emotionally, what's your most common response?"

**Options**:

- `lean_in_connect`: "Lean in and connect"
- `slow_down_stay_engaged`: "Slow down but stay engaged"
- `create_distance`: "Create distance / need space"
- `test_them`: "Test them to see if they're safe"
- `overgive_try_to_earn`: "Overgive / try to earn their closeness"
- `feel_anxious`: "Feel anxious but push through"
- `run`: "Feel urge to run"
- `other`: "Other (write in)"

---

### Q25 [FULL] — Biggest Fear If This Goes Well

**Type**: free_text  
**Prompt**: "This might sound strange, but: What are you most afraid will happen if this actually goes well?"

**Examples**:

- "That I'll lose my independence. I've worked hard to be okay alone."
- "That they'll see the real me and be disappointed."
- "That I'll mess it up somehow like I always do."

---

## Section 6: Communication & Conflict

> *How you talk through hard things—and what makes you shut down.*

### Q26 [LITE] — Hard Conversation Preferences

**Type**: compound  
**Prompt**: "When we need to talk about something hard, what helps you engage rather than shut down?"

**Fields**:

1. `preferred_approach` (single_select):
   - `direct_in_person`: "Direct and in-person"
   - `gentle_lead_in`: "Gentle lead-in first (heads up)"
   - `write_first`: "Write it out first, then talk"
   - `walk_and_talk`: "Walk and talk (side by side)"
   - `time_to_process`: "Give me time to process before responding"
   - `other`: "Other (write in)"
2. `timing_matters` (single_select):
   - `right_away`: "Right away—don't let it fester"
   - `within_24h`: "Within 24 hours"
   - `when_calm`: "When we're both calm and rested"
   - `scheduled`: "Scheduled / intentional time"
3. `notes` (short_text, optional): "What shuts you down?"

**Examples**:

- "Gentle lead-in, then direct. Within 24 hours. Shuts me down: being cornered or accused."

---

### Q27 [LITE] — After Conflict, How Quickly Can You Repair?

**Type**: single_select  
**Prompt**: "After a conflict, how quickly can you usually reconnect and repair?"

**Options**:

- `same_day`: "Same day"
- `1_2_days`: "1-2 days"
- `within_week`: "Within a week"
- `rarely_stay_stuck`: "Rarely—we stay stuck"
- `depends_other_person`: "Depends heavily on the other person"
- `other`: "Other (write in)"

---

### Q28 [LITE] — What Makes Feedback Hard to Receive

**Type**: single_select  
**Prompt**: "What makes feedback hard for you to receive?"

**Options**:

- `timing_when_stressed`: "Bad timing (when I'm already stressed)"
- `tone_harsh_critical`: "Harsh or critical tone"
- `feels_like_attack`: "Feels like an attack on my character"
- `in_public`: "In front of others"
- `no_acknowledgment`: "No acknowledgment of what I'm doing right"
- `piling_on`: "Multiple things at once"
- `nothing_usually`: "Nothing really—I receive feedback well"
- `other`: "Other (write in)"

---

### Q29 [FULL] — A Topic You Avoid

**Type**: free_text  
**Prompt**: "Is there a topic you tend to avoid in relationships—even when it needs to be discussed? Why?"

**Examples**:

- "Money. I grew up poor and feel ashamed talking about finances."
- "Sex. Past trauma makes it hard to initiate these conversations."

---

## Section 7: Values & Faith Alignment

> *What matters most to you—and how important is shared faith?*

### Q30 [LITE] — Faith / Spirituality Profile

**Type**: compound  
**Prompt**: "What role does faith or spirituality play in your life right now?"

**Fields**:

1. `importance` (single_select):
   - `central`: "Central—it's my guiding anchor"
   - `important`: "Important—influences my choices"
   - `somewhat`: "Somewhat important"
   - `minimal`: "Minimal right now"
   - `none`: "Not part of my life"
   - `in_transition`: "In transition / figuring it out"
   - `prefer_not`: "Prefer not to say"
2. `tradition` (single_select):
   - `lds`: "Latter-day Saint (LDS)"
   - `christian`: "Christian (non-LDS)"
   - `spiritual_not_religious`: "Spiritual but not religious"
   - `none`: "Not religious/spiritual"
   - `other`: "Other (write in)"
3. `faith_alignment_importance` (single_select):
   - `essential`: "Essential—we must align"
   - `very_important`: "Very important but some flexibility"
   - `somewhat`: "Somewhat important"
   - `not_important`: "Not important to me"
   - `open`: "Open to different perspectives"
4. `notes` (free_text, optional): "Anything you want to add about your faith journey?"

---

### Q31 [LITE] — Non-Negotiable Values

**Type**: compound  
**Prompt**: "What are your non-negotiable values in a relationship? Select and rank your top 5."

**Fields**:

1. `values_ranked` (ranked_select, max 5):
   - `honesty`: "Honesty / transparency"
   - `faith`: "Shared faith"
   - `emotional_safety`: "Emotional safety"
   - `respect`: "Respect"
   - `family_priority`: "Family as priority"
   - `growth_mindset`: "Growth mindset"
   - `stability`: "Stability / reliability"
   - `adventure`: "Adventure / spontaneity"
   - `service_giving`: "Service / giving back"
   - `integrity`: "Integrity"
   - `humor`: "Humor / fun"
   - `other`: "Other (write in)"
2. `notes` (free_text, optional): "Why are these most important right now?"

---

### Q32 [LITE] — One Value You'd Compromise vs. One You Wouldn't

**Type**: compound  
**Prompt**: "What's a value you could be flexible on—and what's one you absolutely couldn't?"

**Fields**:

1. `flexible_on` (short_text): "I could be flexible on..."
2. `non_negotiable` (short_text): "I absolutely couldn't compromise on..."
3. `notes` (free_text, optional): "Why the distinction?"

---

### Q33 [FULL] — Faith-Specific Commitments (Conditional)

**Type**: compound  
**Prompt**: "If your faith includes specific commitments or standards that affect dating, how clear and steady are you with them?"

*showWhen: faith importance = central, important, or somewhat*

**Fields**:

1. `clarity` (single_select):
   - `clear_aligned`: "Clear and aligned—I can live what I believe"
   - `clear_struggling`: "Clear, but I sometimes struggle"
   - `unclear`: "Not clear yet—still sorting it out"
   - `not_applicable`: "Not applicable to me"
2. `commitments` (short_text, optional): "Name 1-3 commitments you hope to keep (e.g., no sex, worship weekly)"
3. `lds_temple` (single_select, showWhen tradition = lds):
   - `current`: "Current temple recommend"
   - `expired`: "Expired"
   - `not_endowed`: "Not endowed / not applicable"
   - `working_toward`: "Working toward it"
   - `prefer_not`: "Prefer not to say"

---

### Q34 [FULL] — Where Faith Gets Complicated

**Type**: free_text  
**Prompt**: "Is there anything about your faith or beliefs that gets complicated in dating? (Doubt, changing beliefs, interfaith considerations, etc.)"

**Examples**:

- "I'm LDS but have questions about some doctrines. I'm still committed but need a partner who can hold space for questions."
- "I'm more devout than most people I meet. Finding someone who matches my practice level is hard."

---

## Section 8: Expectations & Pacing

> *What you're dating toward and what pace feels right.*

### Q35 [LITE] — What Are You Dating Toward?

**Type**: compound  
**Prompt**: "What are you dating toward right now?"

**Fields**:

1. `goal` (single_select):
   - `marriage`: "Marriage / lifelong partnership"
   - `committed_relationship`: "Committed relationship (not sure about marriage yet)"
   - `exploring`: "Exploring / learning (low pressure, intentional)"
   - `companionship`: "Companionship / social connection"
   - `unsure`: "Not sure yet"
2. `timeline` (single_select):
   - `no_timeline`: "No fixed timeline"
   - `sooner`: "Sooner than later (0-12 months to serious commitment)"
   - `moderate`: "Moderate (1-2 years)"
   - `no_rush`: "No rush (whenever it feels right)"
3. `notes` (short_text, optional): "Anything else about your expectations?"

---

### Q36 [LITE] — Exclusivity & Labels

**Type**: compound  
**Prompt**: "At what point would you want exclusivity and labels?"

**Fields**:

1. `exclusivity_preference` (single_select):
   - `quickly`: "Quickly—within a few weeks/dates"
   - `moderate`: "After we know there's something real (1-3 months)"
   - `slowly`: "Slowly—I need time to be sure (3+ months)"
   - `conversation_first`: "When we've had a direct conversation about it"
   - `no_preference`: "No strong preference"
2. `multi_dating` (single_select):
   - `fine_early_on`: "Fine early on until we discuss exclusivity"
   - `prefer_not`: "I prefer we focus on each other from the start"
   - `depends`: "Depends on how quickly we click"
3. `notes` (short_text, optional): "What would you want to know from them about this?"

---

### Q37 [FULL] — Physical Pacing

**Type**: compound  
**Prompt**: "For physical intimacy, what pace feels right to you at this stage?"

**Fields**:

1. `comfort_level_now` (multi_select, max 4):
   - `hand_holding`: "Hand holding"
   - `hugging`: "Hugging"
   - `cuddling`: "Cuddling"
   - `kissing`: "Kissing"
   - `more_when_trust_builds`: "More as trust builds"
   - `waiting_for_commitment`: "Waiting for significant commitment"
   - `waiting_for_marriage`: "Waiting for marriage"
2. `approach_that_works` (single_select):
   - `ask_first`: "Ask before initiating"
   - `soft_checkin`: "Soft check-in ('I'd like to...')"
   - `read_the_moment`: "Read the moment (nonverbal cues)"
   - `take_it_very_slow`: "Take it very slow by default"
3. `notes` (short_text, optional): "How do you want to handle if we're not aligned?"

---

### Q38 [FULL] — Introducing Family/Friends

**Type**: single_select  
**Prompt**: "When would you want to start introducing each other to close friends or family?"

**Options**:

- `early`: "Early—I like getting input from people I trust"
- `after_exclusivity`: "After we're exclusive"
- `few_months`: "After a few months of dating"
- `when_serious`: "When it's clearly heading toward serious"
- `no_rush`: "No rush—whenever it feels natural"
- `other`: "Other (write in)"

---

## Section 9: Life Logistics Reality

> *The practical stuff that affects capacity and compatibility.*

### Q39 [LITE] — Kids Situation

**Type**: compound  
**Prompt**: "What's your situation with children?"

**Fields**:

1. `current_kids` (single_select):
   - `no_kids`: "No kids"
   - `kids_full_custody`: "Kids (full custody)"
   - `kids_shared_custody`: "Kids (shared custody)"
   - `kids_occasional`: "Kids (occasional visitation)"
   - `adult_kids`: "Adult children"
2. `want_more_kids` (single_select):
   - `yes_definitely`: "Yes, definitely want kids (or more kids)"
   - `open`: "Open to it"
   - `no`: "No—I don't want kids"
   - `done`: "Done having kids"
   - `unsure`: "Unsure"
3. `flexibility` (single_select):
   - `non_negotiable`: "This is non-negotiable for me"
   - `somewhat_flexible`: "Somewhat flexible"
   - `very_flexible`: "Very flexible"
4. `notes` (short_text, optional): "How does your kids situation affect dating?"

---

### Q40 [LITE] — Time Availability

**Type**: single_select  
**Prompt**: "Realistically, how much time and energy do you have for a relationship right now?"

**Options**:

- `plenty`: "Plenty—this is a priority for me"
- `moderate`: "Moderate—I can make time but life is busy"
- `limited`: "Limited—I'm stretched thin right now"
- `variable`: "It varies a lot week to week"
- `unsure`: "Not sure—I haven't tested it"

---

### Q41 [FULL] — Financial Reality

**Type**: single_select  
**Prompt**: "How would you describe your financial situation right now?"

**Options**:

- `stable_comfortable`: "Stable and comfortable"
- `stable_but_careful`: "Stable but I need to be careful"
- `rebuilding`: "Rebuilding / recovering from setback"
- `stressed`: "Stressed / dealing with significant challenges"
- `prefer_not`: "Prefer not to say"

---

### Q42 [FULL] — Other Major Constraints

**Type**: free_text  
**Prompt**: "Are there any other major life constraints that would affect this relationship? (Health, caregiving, career demands, location, etc.)"

**Examples**:

- "I'm primary caregiver for an aging parent—my time is limited."
- "My job might require relocation in the next year."

---

## Section 10: Growth & Self-Awareness

> *What you're working on and what they'd need to know.*

### Q43 [LITE] — Top Growth Areas

**Type**: compound  
**Prompt**: "What are the top 3 things you're actively working to grow or improve in yourself right now?"

**Fields**:

1. `growth_areas_ranked` (ranked_select, max 3):
   - `communication`: "Communication skills"
   - `emotional_regulation`: "Emotional regulation"
   - `boundaries`: "Setting/holding boundaries"
   - `vulnerability`: "Being vulnerable"
   - `patience`: "Patience"
   - `trust`: "Trusting others"
   - `self_worth`: "Self-worth / confidence"
   - `conflict_skills`: "Conflict resolution"
   - `attachment_healing`: "Healing attachment patterns"
   - `faith_practice`: "Faith / spiritual practice"
   - `health_wellness`: "Physical health / wellness"
   - `career_finances`: "Career / finances"
   - `other`: "Other (write in)"
2. `notes` (free_text, optional): "What does growth look like for you right now?"

---

### Q44 [LITE] — What They Need to Know to Love You Well

**Type**: compound  
**Prompt**: "What does this person need to know to love you well? Not what you want them to know—what they actually need."

**Fields**:

1. `primary_need` (single_select): "The most important thing they need to know"
   - `consistency`: "I need consistency—inconsistency triggers me"
   - `direct_communication`: "I need direct communication—I don't pick up hints"
   - `space_after_conflict`: "I need space after conflict before I can repair"
   - `reassurance`: "I need reassurance—I can get anxious easily"
   - `independence`: "I need independence—too much togetherness overwhelms me"
   - `quality_time`: "I need quality time—I feel loved through presence"
   - `patience`: "I need patience—I process slowly"
   - `gentleness`: "I need gentleness—harsh tones shut me down"
   - `other`: "Other (write in)"
2. `explanation` (free_text): "Describe what they need to know to love you well"
3. `what_doesnt_work` (short_text, optional): "What approach definitely doesn't work with you?"

**Examples**:

- "Primary: consistency. I need follow-through. What doesn't work: last-minute cancellations without explanation."

---

### Q45 [FULL] — What Would Make You Walk Away

**Type**: free_text  
**Prompt**: "What would make you call this off early—even if you liked them?"

**Examples**:

- "If I sensed dishonesty about something important, even once."
- "If they were unkind to strangers or service workers."
- "If they pushed physical boundaries after I said no."

---

## Section 11: Where We Stand

> *Your honest assessment of where you are.*

### Q46 [LITE] — Readiness Self-Assessment

**Type**: compound  
**Prompt**: "On a scale of 1-10, how ready are you for a committed relationship right now?"

**Fields**:

1. `readiness_score` (number, 1-10): "Your readiness score"
2. `why_that_score` (short_text): "Why that number?"
3. `state_or_typical` (single_select): "Does this reflect how you are right now, or how you usually are?"
   - `right_now`: "Right now (temporary state)"
   - `usually`: "Usually (this is typical for me)"
   - `both`: "Both—this is consistent"
4. `what_would_raise_it` (short_text, optional): "What would raise your score?"

**Examples**:

- "7. I've done a lot of work but still have some fear about being hurt. This is typical. More time and seeing their consistency would help."

---

### Q47 [LITE] — What You're Hoping For

**Type**: free_text  
**Prompt**: "In one honest sentence: What are you hoping for with this specific person?"

**Examples**:

- "That this is the person I don't have to pretend with."
- "That we can build something slow and steady together."
- "That they see me and choose me anyway."

---

### Q48 [FULL] — If This Doesn't Work

**Type**: free_text  
**Prompt**: "If this doesn't work out, what will you take away from it?"

**Examples**:

- "That I can show up authentically, even if it's scary."
- "Better clarity on what I actually need."
- "Practice at communicating my needs early."

---

## Manifests

### Lite Manifest (31 questions)

**Purpose**: Core compatibility check. Can be completed in 45-60 minutes.

**Questions**: Q01, Q02, Q03, Q04, Q06, Q07, Q08, Q09, Q11, Q12, Q13, Q14, Q17, Q18, Q19, Q22, Q23, Q26, Q27, Q28, Q30, Q31, Q32, Q35, Q36, Q39, Q40, Q43, Q44, Q46, Q47

---

### Full Manifest (47 questions)

**Purpose**: Deep compatibility and self-discovery. 90-120 minutes.

**Questions**: All questions Q01-Q48 (excluding removed Q10)

---

## Design Notes

### Faker Detection Strategies Employed

1. **Third-party perspectives**: Q19 asks what ex/friends would say about you
2. **Behavioral specificity**: Q17, Q18 ask what you *actually* do, not what you'd like to do
3. **Contrasting questions**: Asking both what you want AND what you realistically expect
4. **Quantified frequency**: Q23 asks how often you need reassurance
5. **Negative framing**: Q20 asks about behaviors you've been told are hurtful
6. **Pattern confession**: Q10 asks about patterns you repeat

### AI Inference Improvements

- **Structured anchors**: Q06 (primary_pull) and Q44 (primary_need) enable cross-user comparability
- **State vs trait flagging**: Q46 includes state_or_typical to prevent over-pathologizing temporary states
- **Pursuit asymmetry**: Q09 captures early power/investment balance for pacing guidance

### Religious Flexibility

- Q13 includes faith_context field that adapts expectations
- Q30 captures faith profile and importance level
- Q33 is conditional on faith importance, includes LDS-specific temple question
- Language throughout is values-based to work for secular users

### Connection to Phase 0

Re-verifies: relationship status (Q01), ex-closure (Q03-Q04), safety (Q05), integrity (Q13), porn/addiction (Q12, Q15)

### Preparation for Phase 1.5

Establishes: communication styles (Q26-Q28), attachment patterns (Q22-24), pacing preferences (Q35-37), conflict style (Q17-Q21)
