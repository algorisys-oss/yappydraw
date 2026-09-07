# Product Hunt launch: YappyDraw

Working document for the PH launch. Everything here is drafted to be pasted, not
rewritten. Facts are checked against the repo at v0.8.226 (1,781 commits, 243 spec files, ~350
logged bug fixes as of this writing). Re-check them on launch morning with the commands
at the foot of this file, because every one of them moves each release. The Medium
article quotes a slightly earlier snapshot, which is drift rather than a contradiction.

---

## 1. The positioning problem, first

YappyDraw does a lot: infinite canvas, diagrams, an Animate-style timeline, a comic
generator, a game mode, a Canva-style design studio, Illustrator-class vector tools.
**That breadth is a liability on Product Hunt, not an asset.** The feed rewards one
clear sentence. A launch that says "it does everything" reads as "it does nothing in
particular", and the comments turn into "so it's Excalidraw?"

So: **lead with one thing, let the breadth be the surprise.** The recommended lead is
the one nobody else can claim honestly:

> A free, open-source drawing app that does the whole job (diagrams, illustration,
> slides and animation) entirely in your browser, with no account and nothing uploaded.

The differentiator is **not** "infinite canvas" (Excalidraw, tldraw, FigJam) and not
"hand-drawn style" (Excalidraw owns that). It is **range plus privacy plus zero
friction**: the only thing in this space where you can draw a flowchart, ink an
illustration with pressure, animate it on a real timeline, and export a deck, with no
login, no upload, and the source public under AGPL.

### Taglines to choose from

PH allows 60 characters. All of these fit.

| # | Tagline | Chars | Leads with |
|---|---|---|---|
| 1 | Draw, diagram, animate. Free, offline, no account | 50 | range + friction |
| 2 | The browser drawing app that also animates and ships decks | 58 | range |
| 3 | Open-source infinite canvas: diagrams to animation | 50 | range + OSS |
| 4 | Draw anything in your browser. Nothing leaves your device | 57 | privacy |

**Recommendation: #1.** It names three verbs a hunter can picture, and "no account" is
the line that makes people click through rather than scroll.

---

## 2. Description (the ~260-char field)

> YappyDraw is a free, open-source canvas for drawing, diagrams, slides and animation.
> Sketch a flowchart, ink an illustration with pressure, animate it on a real timeline,
> export a deck. No account, works offline, and your drawings never leave your browser.

---

## 3. First comment (post this yourself, within a minute of going live)

This matters more than anything else on the page. Do not make it a feature list, since
the page already has one. Make it the story, which in this case is genuinely unusual.

> Hi Product Hunt 👋
>
> I'm Rajesh. I started YappyDraw on 10 January this year because I wanted one canvas
> that didn't make me choose. Diagramming tools can't draw. Drawing tools can't animate.
> Animation tools want a subscription and an account before you can see a blank page.
>
> Eight months later it's an infinite canvas with 100+ shapes, UML and BPMN, an
> Animate-style frame timeline with tweens and onion skinning, Illustrator-class vector
> tools (pen, node editing, pathfinder booleans, masks), a Canva-style design mode, and,
> because I couldn't resist, a comic generator that turns a screenplay into a strip plus
> a Flash-style game mode.
>
> Three things I'd want to know if I were you:
>
> **It's genuinely free and genuinely private.** No account, no upload, no tier. Your
> drawings live in your browser's storage. It's an installable PWA, so after the first
> visit it works with no network at all. Source is AGPL-3.0.
>
> **It was architected by me and largely typed by an AI.** ~1,780 commits, ~208k lines,
> 266 releases. I wrote a 40-rule file the model reads before every session, and 440
> recorded learnings. I've written up how that actually worked. It's less magical and
> more boring than the demos suggest, and the interesting part is verification.
>
> **The people who found the bugs are artists, not testers.** Anshika and Shriraj have
> been drawing real work in it for months; most of the entries in that learnings file
> exist because something they tried broke.
>
> Everything that comes in through Support goes to the people actively working on it:
> devs, artists, testers. Nothing is held back as profit.
>
> I'll be here all day. Ask me anything, and please tell me what breaks.

Trim to taste. The three-bold-points structure survives skimming; a wall of prose does not.

---

## 4. Gallery, the part that decides the launch

PH is a visual feed. **The first image is the product.** Budget real time here; it
matters more than the copy above.

Recommended order (first is the thumbnail, so it must work at ~300px):

1. **Hero.** One finished, attractive drawing on the canvas with the UI visible. Not an
   empty canvas, not a feature collage. Use one of Anshika's or Shriraj's pieces (ask
   first, and credit them in the caption).
2. **The range, in one frame.** A 2×2: diagram, illustration, animation timeline,
   design page. This is where breadth is an asset, *after* the lead has landed.
3. **Animation Studio.** A GIF. The timeline scrubbing with onion skinning on is the
   single most "wait, in a browser?" moment in the app.
4. **Comic Studio.** A GIF: type a screenplay, get a strip. Highly shareable, and
   nothing else on PH does it.
5. **Offline / privacy.** Devtools with the network throttled to Offline and the app
   working. Proof rather than a claim.
6. **Sketch vs architectural.** The same drawing in both render styles, side by side.

Format notes: 1270×760, PNG or GIF, under 3MB. GIFs autoplay in the feed and beat static
images, so at least two should move.

**Draw the non-screenshot frames in YappyDraw itself**, the way the Medium article's
figures were. If anyone asks how a frame was made, "in the app" is a much better answer
than "in Figma", and it's the kind of detail PH commenters notice.

---

## 5. Topics

Pick 3. Recommended: **Design Tools**, **Open Source**, **Productivity**.

Consider swapping Productivity for **Developer Tools**. The `api.ts` scripting surface,
the Mermaid importer and the DSL genuinely appeal there, and that audience upvotes.
Do not pick Art, which is a low-traffic topic on PH.

---

## 6. Timing

- **Launch at 12:01 AM PT.** The 24-hour clock starts then; going live at noon PT throws
  away half the ranking window. That is **1:31 PM IST**, a civilised hour for once.
- **Tuesday, Wednesday or Thursday.** Monday is crowded, Friday and the weekend are dead.
- Avoid the week of a major Figma/Adobe/Canva announcement. You will be buried.
- Block the whole day. Reply to every comment within minutes. PH weights engagement, and
  a maker who answers is the difference between #12 and #3.

---

## 7. Pre-launch checklist

Do these in the week before. Several are not optional.

- [ ] **Ship a release and verify it.** `npm run verify:deploy` must pass on every line.
      A broken build on launch day is unrecoverable.
- [ ] **Fix `npm run build`.** It currently fails at the prerender step because
      `articles/vibe-architecting-yappydraw/*.md` has no help-doc frontmatter. This blocks
      shipping anything. See the open question in that folder.
- [ ] **Set `VITE_SUPPORT_RAZORPAY_URL` on the host** so the Support button actually
      appears in the production build. It is env-only by design, and unset means the
      feature is absent with nothing to tell you so.
- [ ] **Load-test the landing path.** A PH front page is a real traffic spike; the app is
      static so it should hold, but confirm the host's bandwidth allowance.
- [ ] **Onboarding.** A first-time visitor from PH has ~15 seconds of patience. Make sure
      the tour or the starting canvas shows something appealing rather than an empty grid.
- [ ] **Mobile.** A large share of PH traffic is phones. Open the site on one and be
      honest about whether that first impression is good enough.
- [ ] **Get a hunter, or self-hunt.** Self-hunting is fine now and keeps maker status.
      A well-followed hunter helps, but only if they genuinely use it.
- [ ] **Line up 15–20 people** who will *genuinely* look on the day. Ask them to comment,
      not just upvote. Comments are weighted and upvote rings get penalised. Send them
      the link on the day, never a "please upvote" message beforehand.
- [ ] **Prepare the "how is this free?" answer.** It will be the first question.
- [ ] **`/learn/` and `/help/` must be up.** Traffic will read them; a 404 there is worse
      than not having them.

---

## 8. Objections you will get, and honest answers

Draft these now. You will not write well at 2 AM.

**"How is this free? What's the catch?"**
No catch and no tier. It's a static site with no backend, so it costs almost nothing to
run and there is no per-user cost to recover. AGPL-3.0, source public. Support is voluntary
and goes to the people working on it.

**"So it's Excalidraw?"**
Excalidraw is excellent and does one thing beautifully. YappyDraw is aimed at the case
where the sketch is the *start*: it also has pressure-sensitive inking, a real animation
timeline, pathfinder booleans and node editing, and slide/PDF/PPTX export. It also
round-trips `.excalidraw` files, so you don't have to choose.

**"Is my data safe?"**
It never leaves your browser, because there is no server to send it to. That is also the
limitation: clear your site data and it's gone, so export anything you care about.

**"AI-built? So it's slop?"**
Fair question. ~350 numbered bug fixes with the mechanism recorded, 243 Playwright spec
files, and a 40-rule process file. I made every architectural decision; the model typed
under those constraints. Judge the artifact, and the source is right there.

**"Mobile/iPad?"**
Apple Pencil pressure, palm rejection, Procreate-style multi-finger gestures, full
toolbar on every iPad size. Phones get a collapsed tool strip and work, but the app is
happiest on a tablet or desktop.

---

## 9. Launch-day timeline (IST)

| Time | Do |
|---|---|
| 13:31 | Goes live. Post the first comment immediately. |
| 13:35 | Message the 15–20 people with the direct link. |
| 14:00 | Post to X/LinkedIn. Link the PH page, not the site. |
| 14:00→ | Answer every comment within ~10 minutes, all day. |
| 18:00 | Post to relevant subreddits and communities, **only where self-promotion is allowed**, leading with the tool rather than the launch. |
| 21:00 | Mid-launch update comment: something you shipped or fixed that day from feedback. This performs well. |
| Next day | Thank-you comment. Answer stragglers, since the page keeps traffic for weeks. |

---

## 10. After

- Write the numbers down: rank, upvotes, visitors, installs, what converted. There is no
  second first launch to learn from.
- Every bug reported on the day goes into `docs/bugs/bug-fixes.md` with its mechanism,
  like the rest.
- The Medium article is the natural follow-up post a week later, once there's an audience
  that has actually used the thing.

---

## Numbers to re-check on launch morning

These change every release; do not paste last month's.

```bash
git rev-list --count HEAD                  # commits
ls tests/*.spec.ts | wc -l                 # spec files
grep -c '^### ' docs/bugs/bug-fixes.md     # numbered bug fixes
node -p "require('./package.json').version"
```
