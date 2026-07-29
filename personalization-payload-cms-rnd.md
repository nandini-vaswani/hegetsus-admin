# Personalized content — what we built & how to test it

R&D with Payload CMS for personalization of content.

**Live preview:** https://payload-admin-experimentation.vercel.app/

---

## What we built

A CMS where an editor can publish a normal page once, then layer **personalized alternatives** on top of it — without ever touching code — and each alternative is addressed by a plain string key that an outside system (an experiment, a segment rule, a feature flag) can match against.

Concretely, an editor can now:

- Build a page out of content blocks (a hero banner, a video, a text section, a rotating prayer, a "next step" list of options).
- Give each block a stable, human-readable name (like `hero` or `next-steps`) so it can be addressed permanently, even if the page gets reordered later.
- Create a **rule** ("if this visitor matches key `variant1`, show them...") that does one of four things, depending on how far the editor drills in — never something they pick from a dropdown, it falls out naturally from what they fill in.

## The four ways a rule can personalize a page

| If the editor... | ...then the rule | Example |
|---|---|---|
| picks only a page | reorders or hides that page's existing blocks | Show the Hero and skip the Video for this audience |
| also picks one block | shows/hides just that block, or moves it | Hide the "Rotating Prayer" block only for this rule |
| also overrides one or more fields on that block | swaps in replacement text/image for those fields | Replace the Hero's headline *and* subhead in one rule |
| overrides a field that's a list (like the Next Step options) | offers a **named alternative list** for that one field | An "anxiety-focused" version of the next-step options, distinct from the default |

That last row is the only place a rule contains more than one named alternative inside it — everything else is one rule = one key, kept deliberately simple.

Nothing here talks to an experimentation platform directly. The CMS only stores content keyed by a string an editor types in (e.g. `variant1`, `anxiety-arm`); a separate service is what actually decides which key a real visitor gets and fetches the matching content to serve.

## Variants — the concept behind them

A **Variant** is a single rule that says: *"when a visitor matches this key, change something about this one page."* Every Variant has exactly three things at its root, no matter what it ends up doing:

- **`key`** — the string an external system (an experiment, a feature flag, a segment) is configured to hand back for a given visitor. Purely a matching string — the CMS never interprets it, it just stores content under it.
- **`page`** — which page this rule applies to.
- **`block`** *(optional)* — which single block on that page this rule narrows down to. Leaving it empty is itself meaningful — it's what makes the rule page-scoped instead of block-scoped.

Everything else — whether it hides a block, swaps a headline, or offers an alternate list of options — is just *how much further the editor drilled in* from those three things. The system never asks "what scope do you want?" — it looks at what got filled in and derives the scope itself. One shape, four depths.

### Why a "surface key" instead of an ID

Payload gives every block an internal auto-generated ID, but IDs aren't stable across re-authoring — reorder the blocks on a page and the IDs still work, but they're meaningless to a human and painful to reference from outside. So every block also carries an editor-assigned `key` (e.g. `"hero"`, `"next-steps"`) — same idea as a page's slug. From that, the system builds a permanent address, `surfaceKey`:

- Page scope → just the page's slug: `stillness`
- Block/field/list scope → slug + block key: `stillness.hero`, `stillness.next-steps`

This address is computed automatically (never typed by the editor) by looking up the page, finding the chosen block, and reading its key. It's what a future consumer (the proxy service) would actually use to say "give me the personalized content for `stillness.hero`" — stable even if someone reorders the page tomorrow.

### Walking through the four depths, with real sample data

**1. Page scope — `variant1`, surfaceKey `stillness`**
The editor picked the *page* but left "block" empty. All that's left to fill in is: which of this page's existing blocks should show, and in what order. Nothing new is authored — it's purely a filter/reorder over blocks that already exist on the base page.

> Example: for visitors matching key `variant1`, show only the Hero and Next Step blocks, skip the Video block, on the `stillness` page.

**2. Block scope — picked a block, no field overrides**
Once a block is picked (say, the Hero), two new fields appear: a visibility toggle and a position number. If the editor stops here without overriding any field, the rule is "just move or hide this one block" — the block's own content is untouched.

> Example: hide the Hero block entirely for one audience, without touching anything else on the page.

**3. Field scope — `variant2`, surfaceKey `stillness.hero`**
Picking a block also reveals "field overrides" — and this is where it gets useful: **one rule can override several fields of the same block at once.** `variant2` overrides both the Hero's Headline *and* Subhead in a single document — not two separate rules, one rule with two override rows.

> Example: `variant2` replaces Headline → "Stillness, made for cricket fans" and Subhead → a matching line, both under the one key `variant2`, both scoped to `stillness.hero`.

**4. List scope — `variant3`, surfaceKey `stillness.next-steps`** — the one special case
Most fields are simple (text or an image) — a field override just replaces one value. But some fields are *lists* (the Next Step block's `options` — an array of next-step choices). Replacing "the whole list" isn't enough on its own, because you might want more than one alternative version of that list depending on which key matches. So **only here**, the field override contains an array of *named alternatives*, each with its own key and its own replacement list of items.

> Example: `variant3` targets the Next Step block's Options field, and inside it defines one named alternative, `anxiety-arm`, whose items list replaces the default next-step options for that audience.

This is the only place in the whole system where one document holds more than one named thing — deliberately, because it only makes sense for a field that's already a list of things.

### Tying it together — the full lifecycle

```
1. Editor publishes "The Path of Stillness" page:
     blocks = [ Hero(key: hero), NextStep(key: next-steps) ]

2. Editor writes three rules against it:
     variant1 → page scope        → surfaceKey: stillness
     variant2 → field scope       → surfaceKey: stillness.hero
     variant3 → list scope        → surfaceKey: stillness.next-steps

3. Separately, someone configures an experiment/feature-flag tool so that:
     - visitors in bucket A get resolved key "variant1"
     - visitors in bucket B get resolved key "variant2"
     - visitors flagged "anxious" get resolved key "variant3"
   (the CMS knows nothing about how that bucketing happens)

4. A real visitor loads the site.
     → the proxy service asks the experiment tool "what key does this visitor get?"
     → gets back e.g. "variant2"
     → asks the CMS: "give me the Variant with key=variant2 for surface stillness.hero"
     → CMS returns: override Headline + Subhead
     → visitor sees the Hero with the swapped-in headline/subhead,
       everything else on the page rendered exactly as authored
```

The reason this holds up as a design: the CMS's job stops at "store content under a key, addressed by a stable surface" — it never needs to know *why* a visitor got that key. That boundary is what lets the experimentation layer change (or get swapped for a different vendor) without touching any of this.

## The end-to-end flow

```
Editor publishes a page (blocks, in order, each with a stable key)
        ↓
Editor creates one or more rules against that page
   — each rule targets a page, or a block on it, or a field, or a field's list —
   — each rule carries a key (e.g. "variant1") that must match a key configured
     elsewhere (the experiment / feature flag / segment tool)
        ↓
A visitor loads the site
        ↓
An outside service decides which key this visitor matches
        ↓
That service asks the CMS for content under that key, gets back the
override (reordered blocks / hidden block / swapped fields / alternate list)
        ↓
Visitor sees the personalized version — the base page is never edited to do this
```

The key thing this proves out: **one flat list of rules is enough to cover page-level, block-level, field-level, and list-level personalization**, addressed by permanent human-readable keys instead of database IDs — so a rule written today still points at the right thing even after the page gets restructured later.

## How to test it yourself

1. Open the live preview above and sign in (or create the first admin user if none exists yet).
2. **Create a page**: give it a title, an intro, and add a couple of blocks — e.g. a Hero and a Next Step block. Give each block a short, memorable key (e.g. `hero`, `next-steps`). Publish it.
3. **Create your first rule** (page-level test): pick that page, leave the block empty, and choose which of the page's blocks should show and in what order. Save — you'll see the rule reports itself as page-scoped.
4. **Create a second rule** (field-level test): this time pick the Hero block, then override its headline (and, if you like, its subhead too, in the same rule) — save and confirm both changes are attached to one rule.
5. **Create a third rule** (list-level test): pick the Next Step block, override its options field, and add a named alternative list (e.g. "anxiety-focused") with its own set of options — save and confirm it reports itself as list-scoped.
6. Each saved rule shows its own permanent address (page name, plus block name if one was picked) and which of the four scopes it landed in — that's the proof the right one was inferred automatically from what you filled in, not something you had to choose.
