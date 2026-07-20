/**
 * Text → pose rules for the comic panel generator.
 *
 * This is Microsoft Comic Chat's trick (SIGGRAPH '96, see
 * docs/microsoft-comic-chat-algorithm.md §4.1): you do NOT need to understand a
 * sentence to pick a convincing gesture for it. A small hand-authored table of
 * shallow lexical cues — emoticons, chat acronyms, ALL CAPS, punctuation,
 * greetings, pronouns — covers the cases that read well in comics.
 *
 * Two design points carried over from the paper:
 *
 * 1. **Big gestures beat subtle ones.** Comic Chat abandoned fine punctuation cues
 *    because subtle expressions get lost at comic scale. What reads is waving,
 *    pointing, shouting — rare in life, legible on the page.
 * 2. **Conflicts resolve by PRIORITY, not blending.** "HI THERE!!!" matches both
 *    greeting and shouting; the higher `strength` wins outright. Composing a blended
 *    pose from parts is not possible with pre-drawn art (and isn't wanted).
 *
 * Pure and deterministic: same text always yields the same pose.
 */

/** How a rule matches the utterance text. */
type Match =
    | { kind: 'sentenceStart'; words: string[] }  // word begins a sentence
    | { kind: 'word'; words: string[] }           // whole word anywhere
    | { kind: 'substring'; needles: string[] }    // raw substring (emoticons)
    | { kind: 'allCaps' }                         // shouting
    | { kind: 'endsWith'; suffixes: string[] };   // trailing punctuation

export interface PoseRule {
    /** Stick-figure asset id (base/male id; variants suffix it). */
    pose: string;
    /** Higher wins when several rules fire. */
    strength: number;
    match: Match;
    /** Why this rule exists — shown in tests/docs, not user-facing. */
    note: string;
}

/** Pose used when nothing matches. */
export const NEUTRAL_POSE = 'daily-standing';

/**
 * The emotion palette — a manual override for the rule table.
 *
 * Comic Chat's key UI idea (§4.1) was that a system can't reliably infer how someone
 * feels, so it let the user say: the emotion wheel set emotion by angle and intensity
 * by radius, overriding the automatic choice. This is the same idea in the shape that
 * suits a narrow dock panel — a small palette of emotions, each mapped to a pose we
 * actually have art for. Choosing one for a speaker overrides `poseForLine`.
 *
 * Kept deliberately short: an emotion nobody can draw is worse than no option at all.
 */
export const EMOTIONS = [
    { id: 'auto', label: 'Auto', pose: '', face: '' },   // no override — use the rule table
    { id: 'neutral', label: 'Neutral', pose: 'daily-standing', face: 'neutral' },
    { id: 'happy', label: 'Happy', pose: 'office-thumbsup', face: 'happy' },
    { id: 'laughing', label: 'Laughing', pose: 'social-celebrating', face: 'excited' },
    { id: 'sad', label: 'Sad', pose: 'daily-sad', face: 'sad' },
    { id: 'angry', label: 'Angry', pose: 'office-stressed', face: 'angry' },
    { id: 'shouting', label: 'Shouting', pose: 'office-megaphone', face: 'surprised' },
    { id: 'thinking', label: 'Thinking', pose: 'daily-thinking', face: 'confused' },
    { id: 'unsure', label: 'Unsure', pose: 'daily-shrug', face: 'confused' },
    { id: 'greeting', label: 'Waving', pose: 'daily-waving', face: 'happy' },
    { id: 'pointing', label: 'Pointing', pose: 'daily-pointing', face: 'neutral' },
    { id: 'idea', label: 'Idea', pose: 'office-idea', face: 'excited' },
    { id: 'presenting', label: 'Presenting', pose: 'office-presenting', face: 'neutral' },
    { id: 'love', label: 'Love', pose: 'social-love', face: 'happy' },
    { id: 'asking', label: 'Asking', pose: 'meeting-raise-hand', face: 'confused' },
] as const;

export type EmotionId = typeof EMOTIONS[number]['id'];

/** Is this token a known emotion (id or label, case-insensitive)? */
export function isEmotionToken(token: string): string | null {
    const t = token.trim().toLowerCase();
    const hit = EMOTIONS.find(e => e.id === t || e.label.toLowerCase() === t);
    return hit && hit.id !== 'auto' ? hit.id : null;
}

/** Pose for an emotion, or null for 'auto' / anything unknown (caller falls back to the rules). */
export function poseForEmotion(id: string | undefined): string | null {
    if (!id || id === 'auto') return null;
    const found = EMOTIONS.find(e => e.id === id);
    return found && found.pose ? found.pose : null;
}

/**
 * Expression for an emotion, or null for 'auto' / anything unknown.
 *
 * The pose alone can't carry the mood: several emotions share body language that reads
 * quite differently on the face (Angry maps to the `office-stressed` pose, whose own
 * default expression is *scared*), so an explicit cue has to set BOTH. When this
 * returns null the figure keeps whatever expression its pose was authored with.
 */
export function faceForEmotion(id: string | undefined): string | null {
    if (!id || id === 'auto') return null;
    const found = EMOTIONS.find(e => e.id === id);
    return found && found.face ? found.face : null;
}

/**
 * The table. Strengths follow Comic Chat's spirit: unmistakable signals (shouting,
 * laughter, explicit emoticons) outrank positional cues (a greeting or pronoun at
 * the start of a sentence), which outrank weak generic cues (a trailing "?").
 */
export const POSE_RULES: PoseRule[] = [
    // ── Unmistakable signals ────────────────────────────────────────────
    { pose: 'social-celebrating', strength: 12, note: 'laughter (chat acronym)',
      match: { kind: 'word', words: ['lol', 'rotfl', 'lmao', 'haha', 'hahaha'] } },
    { pose: 'daily-sad', strength: 12, note: 'sad emoticon',
      match: { kind: 'substring', needles: [':-(', ':(', ':‑(', '😞', '😢'] } },
    { pose: 'social-celebrating', strength: 11, note: 'happy emoticon',
      match: { kind: 'substring', needles: [':-)', ':)', '😀', '😄', '🎉'] } },
    { pose: 'office-megaphone', strength: 11, note: 'shouted punctuation',
      match: { kind: 'substring', needles: ['!!!', '!!'] } },
    { pose: 'office-megaphone', strength: 10, note: 'ALL CAPS = shouting',
      match: { kind: 'allCaps' } },

    // ── Positional cues (Comic Chat rules 5-7) ──────────────────────────
    { pose: 'daily-waving', strength: 9, note: 'greeting/farewell opens the sentence',
      match: { kind: 'sentenceStart', words: ['hi', 'hey', 'hello', 'howdy', 'bye', 'goodbye', 'welcome'] } },
    { pose: 'office-idea', strength: 8, note: 'proposing an idea',
      match: { kind: 'word', words: ['idea', 'proposal', 'suggest', 'brainstorm'] } },
    { pose: 'daily-thinking', strength: 7, note: 'tentative / reflective',
      match: { kind: 'word', words: ['think', 'thinking', 'maybe', 'perhaps', 'wonder', 'guess', 'hmm'] } },
    { pose: 'daily-pointing', strength: 6, note: 'other-reference (Comic Chat rule 7)',
      match: { kind: 'sentenceStart', words: ['you', "you're", 'your'] } },
    { pose: 'daily-pointing', strength: 5, note: 'other-reference mid-sentence',
      match: { kind: 'word', words: ['you', "you're", "aren't you", 'did you', 'will you'] } },
    { pose: 'office-presenting', strength: 5, note: 'self-reference — presenting a position',
      match: { kind: 'sentenceStart', words: ['i', "i'm", "i'll", "i'd", "i've"] } },

    // ── Weak generic cues ───────────────────────────────────────────────
    { pose: 'daily-shrug', strength: 3, note: 'a question with no stronger signal',
      match: { kind: 'endsWith', suffixes: ['?'] } },
];

const isWordChar = (ch: string) => /[A-Za-z0-9']/.test(ch);

/** Whole-word search (word-boundary aware, case-insensitive on already-lowered text). */
const hasWord = (lower: string, word: string): boolean => {
    let from = 0;
    for (;;) {
        const i = lower.indexOf(word, from);
        if (i < 0) return false;
        const before = i === 0 ? '' : lower[i - 1];
        const after = lower[i + word.length] ?? '';
        if ((!before || !isWordChar(before)) && (!after || !isWordChar(after))) return true;
        from = i + 1;
    }
};

/** Does `word` start any sentence in the text? Sentences split on . ! ? */
const startsSentence = (lower: string, word: string): boolean =>
    lower
        .split(/[.!?]+/)
        .map(s => s.trim())
        .some(s => {
            if (!s.startsWith(word)) return false;
            const after = s[word.length] ?? '';
            return !after || !isWordChar(after);
        });

/**
 * ALL CAPS test, mirroring Comic Chat's: at least two uppercase letters and no
 * lowercase ones, so "OK" or an acronym inside normal prose doesn't trigger it.
 */
export const isAllCaps = (text: string): boolean => {
    let uppers = 0;
    for (const ch of text) {
        if (ch >= 'a' && ch <= 'z') return false;
        if (ch >= 'A' && ch <= 'Z') uppers++;
    }
    return uppers > 1;
};

const matches = (rule: PoseRule, text: string, lower: string): boolean => {
    switch (rule.match.kind) {
        case 'allCaps': return isAllCaps(text);
        case 'substring': return rule.match.needles.some(n => text.includes(n));
        case 'word': return rule.match.words.some(w => hasWord(lower, w));
        case 'sentenceStart': return rule.match.words.some(w => startsSentence(lower, w));
        case 'endsWith': return rule.match.suffixes.some(s => text.trimEnd().endsWith(s));
    }
};

/**
 * Pick the pose for one line of dialogue. Highest-strength matching rule wins;
 * ties break by table order so the result is stable. Returns NEUTRAL_POSE when
 * nothing matches.
 */
export function poseForLine(text: string): string {
    const lower = text.toLowerCase();
    let best: PoseRule | null = null;
    for (const rule of POSE_RULES) {
        if (!matches(rule, text, lower)) continue;
        if (!best || rule.strength > best.strength) best = rule;
    }
    return best ? best.pose : NEUTRAL_POSE;
}

/**
 * Explain the choice — every rule that fired, strongest first. Used by tests and
 * useful for debugging why a figure struck a particular pose.
 */
export function explainPose(text: string): { pose: string; fired: PoseRule[] } {
    const lower = text.toLowerCase();
    const fired = POSE_RULES.filter(r => matches(r, text, lower))
        .sort((a, b) => b.strength - a.strength);
    return { pose: fired.length ? fired[0].pose : NEUTRAL_POSE, fired };
}
