# How Microsoft Comic Chat worked (no LLM, no NLP)

> A study of the algorithms behind Comic Chat (Microsoft Research, 1996) — how it
> turned plain IRC text into laid-out comic panels with posed characters and word
> balloons, using **only heuristics, a priority-ranked rule table, and geometric
> layout**. No language model, no natural-language understanding.

**Primary source:** Kurlander, Skelly, Salesin, *"Comic Chat"*, SIGGRAPH '96
Proceedings, pp. 225–236.
**Code source (open-sourced by Microsoft, July 2026):** `github.com/microsoft/comic-chat`.
Local reference clone: `/home/rajesh/opensource/comic-chat` (v2.1b is the fullest tree).
Section/figure references below are to the paper; file references are to the code.

---

## 1. The central design bet

The team gathered real chat transcripts, annotated them with "things a computer
could plausibly extract," and had comic artist **Jim Woodring** illustrate a
representative session. Their worry going in (paper §3): a good comic
representation might require *deep* semantics beyond 1996 NLP. The finding that
made the whole product feasible:

> "…it became clear that we could produce interesting comics with only very
> limited semantics, and **without any natural language processing.**"

So Comic Chat never tries to *understand* a sentence. It:

1. **Pushes the hard subjective call (emotion) onto the user** via a direct-manipulation UI (the emotion wheel).
2. **Uses a small priority-ranked keyword rule table** for default gestures/expressions.
3. **Spends the real engineering on deterministic 2-D layout** (character placement, balloon routing, panel breaks, camera zoom) driven by comic-composition rules.

Everything "AI-ish" about the output is an illusion assembled from those three
unglamorous parts plus a large library of hand-drawn poses.

### Pipeline (per utterance / per panel)

```
text in
  │
  ├─ (a) infer default gesture + expression   → rule table (textpose.cpp)  ── user can override via emotion wheel
  │
  ├─ (b) decide which characters appear in the panel   → inclusion rules (§4.2)
  │
  ├─ (c) order + orient characters   → minimize evaluation fn, greedy (§4.3)
  │
  ├─ (d) lay out word balloons   → routing-channel algorithm (§5.2), greedy bodies + deferred tails
  │
  ├─ (e) decide panel break?   → 4 rules (§6.1)
  │
  └─ (f) choose camera zoom + semantic elements (§6.2–6.3)
  │
render: composite head+body bitmaps (+halos), draw balloons, draw background
```

Note (paper §7): **each client composes its own panels independently** — only the
symbolic gesture/expression and bitmap indices travel over IRC (encoded as a short
string prefixed to each message). Two people in the same room can see the same
conversation laid out into *different* panels.

---

## 2. Characters — gestures & expressions (§4.1)

Terminology: **gesture** = body pose, **expression** = facial pose. Most
characters are a set of interchangeable heads on a set of bodies, so expression
and gesture are chosen independently and composited.

### 2.1 The rule table (the "semantic net" is just this)

The paper lists the hand-authored conventions the artist and transcripts
suggested:

| # | Trigger | Result |
|---|---------|--------|
| 1 | Emoticons `:-)` / `:-(` | happy / sad expression |
| 2a | `LOL`, `ROTFL` | laughter |
| 2b | `IMHO` | point to self |
| 2c | `BRB` | wave |
| 2d | `<g>` / `<grin>` | smile |
| 3 | ALL CAPS | shouting |
| 4 | `!!!` | shouting |
| 5 | sentence starts with `Hi`, `Hello`, `Bye`, `Goodbye`, `Welcome` | wave |
| 6 | self-refs: sentence starts with `I`, or `I'll`, `I'm`, `I am`, `I'd`… | point to self |
| 7 | other-refs: `You` (start), `are you`, `will you`, `did you`, `don't you`… | point to other |

Design insight from §4.1 worth remembering: they **abandoned subtle punctuation
cues** (`?` = questioning, single `!` = exclaiming) because subtle expressions get
lost at comic scale. What reads well in comics are **big, relatively rare
gestures** — pointing and waving — so those are what the rules emphasize.

### 2.2 How the rules actually run (code: `cchat/textpose.cpp`)

The shipping engine is **data-driven**, not hard-coded. Rules are loaded from
string resources (`InitializeEmotionRules` → `LoadCompositeRule` →
`RegisterRule`) into three buckets, each matched differently:

- **`FindString` / `FindString*`** → `generalRules`: raw substring anywhere (`strstr`). `*` = case-insensitive.
- **`CheckWord` / `CheckWord*`** → `wordRules`: substring that is a *whole word* (bounded by start/space/punctuation — see `CheckWord()`).
- **`CheckStart` / `CheckStart*`** → `sentenceRules`: matches at the *start of each sentence* (sentences split on `.!?` via `GetNextSentenceStart`).
- **`AllCaps`** → a single global caps rule; fires when `CheckForUppers()` sees >1 uppercase and no lowercase.

`GetEmotionsFromString()` (textpose.cpp:268) runs all four passes and pushes every
match into a `CEmotionOpts` accumulator via `emOpts.Add(emotion, weight, strength)`.

### 2.3 Conflict resolution = a **priority (strength) number**, not scoring

Multiple rules can fire on one line ("Hi Sue, how are you?" → both *wave* and
*point-outward*). Composing arbitrary 2-D body-part bitmaps into a combined pose
is an "impossible art authoring process" (§4.1), so instead **the highest-strength
option wins** — a prioritization scheme, not a blend. Strengths seen in the
(disabled reference) code and defaults:

| Emotion action | Strength |
|---|---|
| `ROTFL` → laugh | 9 |
| `LOL` → laugh | 11 |
| Wave (greeting at sentence start) | 11 |
| Point-self / point-other (word rules `i'm`, `are you`…) | 8 |
| Point-self / point-other (sentence-start `I` / `You`) | 3 |

Special action pseudo-emotions are literal constants (`avatar.h`):
`EM_WAVE = 1001`, `EM_POINTOTHER = 1002`, `EM_POINTSELF = 1003` — deliberately far
from the numeric emotion range so they're distinguishable from wheel emotions.

Because gesture and expression are independent, **non-conflicting indicators can
combine** across the two axes: `"I can't make it :-("` → *points to self* (gesture)
**and** *frowns* (expression).

When nothing matches, the system picks a **neutral** pose — and it keeps *several*
neutrals and **cycles through them** to avoid mechanical repetition.

### 2.4 The emotion wheel (§4.1) — the key UX move

A circular chooser, exactly analogous to a saturation/value color picker:

- **Angle** = emotion type, distributed around the rim: *coy, happy, laughing, shouting, angry, sad, scared, bored*.
- **Radius** = intensity; **center = neutral**, rim = maximum.
- One mouse drag sets both type and intensity. A wheel emotion can drive **both** expression and gesture at once (Fig. 1: neutral → slightly angry → very angry).

Actions that aren't emotions (wave, point) are **not** on the wheel; you invoke
those by clicking a character and picking from a pop-up menu. Gestures/expressions
can be sent **with or without accompanying text** (much of communication is
non-verbal).

The wheel is the whole trick for the hardest problem: the system never has to
*infer* your mood, because you supply it cheaply and continuously. Live feedback
shows your character's current auto-selected pose as you type, so overriding is
optional.

---

## 3. Characters — who to show, where, and facing which way

### 3.1 Inclusion (§4.2)

At most ~**5** characters fit a panel (facial expressions become unreadable
beyond that). Rules, in spirit "like TV/film, don't show everyone in every shot":

- **Always** show a character while it is speaking (pro artists break this only for stylistic effect — Fig. 2a shows the failure).
- Show the **addressee(s)** when someone starts talking to someone new; once established, the addressee may be dropped from later panels.
- Show a character that **reacts** (gesture/expression) even without speaking.
- Show a **newly entered** participant immediately, speaking or not (signals "someone new is here").

### 3.2 Who is talking to whom

Needed for facing rules, but not always explicit. Comic Chat looks for **chat
participants' nicknames inside each utterance** to infer the addressee; users can
also explicitly select addressees with the mouse. No addressee → treated as a
statement to the group, and the character is made to face **as many participants
as possible**.

### 3.3 Placement & orientation via an evaluation function (§4.3)

People talking face each other and stand near each other. Comic Chat encodes this
as a **cost function over orderings + orientations** (lower = better). For the set
of characters `C` in the panel, minimize:

```
   Σ            ( Facing(a, b) + Neighbors(a, Left(a), Right(a)) )
a,b ∈ C, a≠b
```

**`Facing(a, b)`** — sum of the penalties whose condition holds (note the
deliberately steep asymmetry: a speaker not facing the person they addressed is
catastrophic):

| Penalty | Condition |
|--------:|-----------|
| **4** | `a` did **not** address its utterance, and `a` is not facing `b` |
| **2** | `a` did **not** address its utterance, and `b` is not facing `a` |
| **4** | `a` **did** address `b`, and `b` is not facing `a` |
| **40** | `a` **did** address `b`, and `a` is not facing `b` |
| **4·n** | `a` addressed `b`, and there are `n` characters *between* them |

**`Neighbors(...)`** — a **1-point** penalty for each left/right neighbor that
differs from who stood in that slot in the *previous* panel. This discourages
characters teleporting around between panels. The paper explicitly ranks this the
**least** important criterion (some artists ignore positional consistency
entirely), which is why its weight is tiny next to the facing penalties.

> The magnitude spread — 40 vs 4 vs 1 — *is* the editorial policy. "Speaker must
> face their addressee" dominates; "keep people roughly in place" is a mild tie-breaker.

**Optimization:** not exhaustive — a **greedy** incremental placement. Place the
first character; for the second, try its 2 positions × 2 orientations and keep the
best; for the third, its 3 positions; and so on. "Not guaranteed optimal, but
adequate and fast."

### 3.4 Rendering characters (§4.4)

- Composite a **head bitmap** onto a **body bitmap** at the right offset; **flip** horizontally if needed to face the right way (code: `CBody*::FlipBodyBox` in `bodycam.cpp`).
- **Halos:** each head/body bitmap ships with a **halo mask** — a ring of white space that makes the character "pop" off busy backgrounds (Fig. 3). Draw **both halos first**, then both bitmaps, so the head's halo can't erase the body and vice-versa.

---

## 4. Balloons (§5) — the geometric heart of the system

### 4.1 Types (§5.1)

Woodring's balloons **flow around the text** (every one different — great for
hiding the machine origin). Four vocabulary types: **speech** (solid outline +
tail), **thought** (tail = a line of ovals; body often cloud-like), **whisper**
(dashed outline + halo, italic text — reused for IRC "whisper to a subset"), and
**shout** (jagged outline; noted as not-yet-implemented in the paper).

### 4.2 Layout: routing channels (§5.2) — the clever bit

Constraints, all simultaneously:

1. All balloons sit **above the tallest character's head** (this style).
2. **Reading order must be exact**: top-to-bottom, and left-to-right among balloons at the same height. (Order is independent of where the *speakers* stand.)
3. Some part of each balloon must **float over the center of its speaker's face** (so the tail can reach the speaker).
4. Add **slight randomness** so it doesn't look machine-regular.

**Bodies are placed greedily** (fast, and packing every balloon tight isn't a goal
— cartoonists don't). **Tails are deferred** until all bodies are placed (a greedy
tail pass gave poor results). The mechanism guaranteeing tails will fit is the
**routing channel**: a per-balloon horizontal interval, reserved above the speaker,
into which that balloon's tail may later drop. Channels are a **disjoint
partition** of the tail-routing space — as each new balloon lands, it **trims the
earlier channels** just enough that every previous balloon keeps a wide-enough
channel for its tail (Fig. 5: a third balloon that would smother balloon 1's
channel is shifted right to preserve it).

**Horizontal placement (paper pseudocode, §5.2):**

```
function PlaceBalloons(B, R, x, T):        # B balloons in reading order, x = face-center of each speaker
    for j = 1 to n:
        w_j := FindWidth(B_j)              # target width (see below)
        R_j := [x_j - w_j, x_j + w_j]      # widest channel that still passes over speaker j's face
        for i = 1 to j-1:
            R_j := MaxAllowable(R_i, x_i, R_j, x_j)   # shrink R_j so each earlier R_i keeps width >= t
        if width(R_j) >= w_j:
            R_j := Position(B_j, R_j)       # pick x within the channel RANDOMLY, set channel = balloon extent
        else:
            if not SqueezeBalloon(R_j, T_j):  # try to fit the text in a narrower channel
                return j-1                    # give up: this balloon didn't fit -> triggers a panel break
        for i = 1 to j-1:
            R_i := ReduceChannel(R_i, x_i, R_j, x_j)   # remove the space R_j now occupies from earlier channels
    return n

function MaxAllowable(R_i, x_i, R_j, x_j):   # trim R_j so R_i stays >= t wide AND still contains x_i
    R := R_j
    if x_i < x_j:  R.l := max(R_i.l + t, x_i)
    else:          R.r := min(R_i.r - t, x_i)
    return R

function ReduceChannel(R_i, x_i, R_j, x_j):  # shrink R_i so it no longer overlaps R_j
    R := R_i
    if x_i < x_j:  R_i.r := min(R_i.r, R_j.l)
    else:          R_i.l := max(R_i.l, R_j.r)
    return R
```

(`t` = minimum channel width needed to anchor a tail. In the source, each balloon
carries its `m_routeRgn` Left/Right — see `semantic.cpp`'s `HackLeft` shifting both
bbox and `m_routeRgn`.)

**Choosing target width:** estimate body area = area of one typeset line × ~1.33
(a third extra for line breaks + leading). Short line ⇒ assume one line tall.
Otherwise derive a conservative max height (distance from the bottom of the lowest
already-placed balloon down to the bottom of the balloon region); min width =
`max(widest single word, area / allowable-height)`; then pick the **final width
randomly** between that minimum and the panel width.

**Vertical placement:** place each balloon **as high as possible** subject to
reading order — a new balloon must be no higher than the **bottom** of any balloon
already placed to its **right**, and no higher than the **top** of any balloon
already to its **left**.

**Overflow:** if a balloon can't be placed, first check whether it fits in a panel
*alone*; if not, split its text into panel-sized balloons, appending **ellipses**
to mark the split.

### 4.3 Balloon body shape (§5.3)

Text is word-wrapped and **centered**. Body outline = **B-spline** with a high
**tension of 5.0** (chosen over cardinal splines) to mimic Woodring's moderately
sharp bends, expanded outward from the text by a margin. Two anti-"amoeba" rules
learned from the artist's samples: (1) never dip inward on one line only to bulge
out on the next; (2) ignore small in/out increments — respond only to larger text-
outline changes. Then, for realism, add **small low-frequency waves** along long
straight runs of outline (code: `AddWavies` + `VWAVEHEIGHT`/`HWAVEHEIGHT`=70,
`VWAVEINTERVAL`/`HWAVEINTERVAL`=300 in `balloon.cpp`).

### 4.4 Balloon tails (§5.4)

- Ideally emanate from **under the bottom line of text**; a non-optimal attach point is used when geometry forces it.
- Attach point: prefer a spot where the last text line spans the channel, set **away from the channel edge** so the tail isn't jammed against a neighbor; else attach to any part of the balloon within the channel, giving the tail a modest **arc** (bounded by horizontal distance from the speaker's head — a deliberate arc, never a long diagonal across the panel).
- All tails come to a point at roughly the **same height**, always in the **lowest third** of the balloon region, below the lowest balloon.
- **Curve direction:** a tail leaving the balloon to the *left* of the speaker curves **counter-clockwise**; to the *right*, **clockwise** — both ending above the center of the speaker's face, avoiding crossing over the speaker's head.

### 4.5 Balloon rendering (§5.5)

Fill interior (hides background) → scan-convert outline → draw text. Whisper halo =
scan-convert the outline first with a thick solid **white** pen, then the real thin
**black dashed** pen. Balloon text is drawn **ALL CAPS regardless of how it was
typed** (comic lettering convention).

---

## 5. Panels (§6)

### 5.1 When to break to a new panel (§6.1)

The current panel keeps being **redrawn** as new dialogue/poses arrive, until a
break rule fires. Four rules:

1. The **balloon layout fails** to fit the new balloon (`PlaceBalloons` returned < n).
2. Adding the input would exceed **5 characters** in the panel. Also: the current impl draws **at most one balloon per character per panel**, so a **second utterance from the same character** forces a break.
3. Rendering the new data would **lose information** — e.g. the same character now needs **two different expressions**, which one panel can't show.
4. **15% random chance** of breaking after a panel's first utterance when that utterance is longer than a few words — so the system occasionally draws a **single-character panel** for pacing variety.

### 5.2 Camera zoom (§6.2)

Constant camera = visually tedious, so the virtual camera's **scale varies** per
panel (balloons are drawn at fixed size, unaffected by zoom):

- **Establishing shots**: a wide surroundings shot when someone enters, and again roughly **every 15 panels**, to re-ground participants.
- Otherwise pull in to the **tightest shot possible**, subject to: never cut a character **at the neck** (keep some shoulder); never let a required character be **clipped by the panel sides**; avoid cutting characters at the **ankles** (knees allowed). Because character count varies (§4.2), the resulting zoom varies too — free visual richness.

### 5.3 Semantic panel elements (§6.3)

The **same keyword trick**, applied to scenery instead of poses. A table of common
chat topics (where you're from, job, sports, pets, kids…) maps keywords → scene
changes. Three variants shown for "Ohio" (Fig. 6): (a) swap the **background** to a
map of Ohio for one panel; (b) **add an object** to the existing background (a
banner); (c) the **"Greek Chorus"** meta-character pops up at the panel bottom with
a canned quip. The elegance (and the cost): a keyword works regardless of sentence
meaning ("born in Ohio" / "never been to Ohio" / "stuck in Ohio" all trigger it),
**but** it needs a large hand-authored art+quip library for coverage. (In the
released source this is gated behind `#if 0` in `semantic.cpp` — the "Ohio" demo
was a SIGGRAPH-figure hack, see `AddSemantics`/`PostSemantics`/`HackLeft`.)

Also: IRC "action" messages (`/me …`) are placed in **narration boxes**; balloons
lay out to the right of and below the box using the same routing algorithm.

---

## 6. Implementation notes (§7)

- **C++**, Windows 95/NT, shipped in Internet Explorer 3 (1996), later Windows 98/NT and the official MSN chat client; localized to 24 languages.
- Transport: **IRC**. Non-textual info (gesture/expression symbol + bitmap indices) is packed into a **short string prefixed to each message**. Text-only IRC clients interoperate — they just see plain text, and appear to Comic Chat users as a randomly assigned character (the rule table is applied to *their* text too, to give them a pose).
- **Bitmap indices** render the exact chosen pose when the receiver has the same character art; otherwise the **symbolic** gesture/expression is applied to whatever character the receiver *does* have — same intent, different actor.
- Character art is **local** on each client (~50 KB compressed per character, 10–15 head/body drawings). Target perf: **< 1 second** to compose and draw a panel on a Pentium.
- The rule set is **user-extensible** (`RegisterRule` parses `Function("arg");strength` entries from resources), and the OO class hierarchy (pages, panels, balloons, characters, poses, backgrounds) was built so new artist styles could be plugged in — though the paper is candid that authoring a new style is "far from trivial."

---

## 7. Takeaways (why this is a great algorithmic case study)

1. **Move the intractable subproblem into the UI.** Emotion inference in 1996 was hopeless; the emotion wheel makes the user supply it in one gesture. The system never guesses mood.
2. **A ranked keyword table beats a parser for this domain.** Priority *numbers* (40 ≫ 4 ≫ 1) encode editorial judgment directly and are trivially tunable and user-extensible — no model, no training data.
3. **The real novelty is deterministic constraint layout**, not "AI": the character-placement evaluation function and the routing-channel balloon algorithm are the parts worth studying and porting.
4. **Greedy where cheap, deferred where quality-sensitive.** Balloon *bodies* are greedy (fast, tight packing unnecessary); *tails* are deferred with reserved channels (greedy tails looked bad). Knowing which subproblem tolerates greed is the craft.
5. **Engineered irregularity.** Random balloon widths/positions, low-frequency outline waves, cycling neutral poses, and a 15% single-panel break all exist purely to *hide* the machine origin — a reminder that "looks hand-made" is itself a spec.

### Relevance to this project (yappy)

The routing-channel idea (reserve disjoint intervals so deferred connectors can
always be routed without overlap) and the greedy-bodies / deferred-tails split map
almost directly onto **connector/edge routing** and **label placement** problems in
a diagramming tool. The placement evaluation-function pattern (a weighted sum of
composition penalties minimized greedily) is a lightweight alternative to full
constraint solvers for **auto-layout** — see `utils/routing.ts` and the mindmap
layout work (`docs/mindmap-layout.md`, `docs/smart-spacing.md`) for where similar
ideas already live here.

---

## Sources

- Kurlander, Skelly, Salesin. ["Comic Chat" (SIGGRAPH '96 Proceedings, pp. 225–236)](https://kurlander.net/DJ/Pubs/SIGGRAPH96.pdf) — the definitive algorithm description; all §/figure references above.
- [ACM DL entry](https://dl.acm.org/doi/10.1145/237170.237260)
- [SIGGRAPH history page](https://history.siggraph.org/learning/comic-chat-by-kurlander-skelly-and-salesin/)
- [DJ Kurlander — Comic Chat project resources](https://kurlander.net/DJ/Projects/ComicChat/resources)
- [Microsoft Open Source Blog: Comic Chat is now open source (2026)](https://opensource.microsoft.com/blog/2026/07/16/microsoft-comic-chat-is-now-open-source/)
- Source code: `github.com/microsoft/comic-chat` — key files `cchat/textpose.cpp` (rule engine), `cchat/balloon.cpp` (balloon/tail construction), `cchat/panel.cpp` (panels), `cchat/bodycam.cpp` (character placement/flip), `cchat/semantic.cpp` (semantic elements), `cchat/avatar.h` (emotion constants).
