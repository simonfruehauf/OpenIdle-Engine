# SUNDERED

### A Grimoire of the Four Aspects — Design Treatise, v3 (Extended)

*Inspired loosely by Theory of Magic by Mathias Hjelm and other idle-RPG progression games, but built as its own world. This is a straight fantasy magic system — mana, spells, mages — the departure is in what the four schools of magic actually are, not in the underlying idea of "elemental idle game."*

---

## Table of Contents

| Section | Chapter | Focus |
| --- | --- | --- |
| 0 | The Premise | World, the Sundering, the Kindled |
| 0.1 | A Short History | Timeline from the Sundering to the present day |
| 1 | Design Pillars | Foundational rules the rest of the doc answers to |
| 2 | The Shape of the Game | Five chapters, narrative and structural overview |
| 2.1–2.5 | Chapter Deep Dives | Tasks, spells, equipment, and resources per chapter |
| 3 | The Four Aspects in Detail | Full six-tier spell lists, per-Aspect texture |
| 4 | Braided Casting in Detail | The four braids, each with its own spell list |
| 5 | Casting Forms | Method / Duration / Target as a combinatorial layer |
| 6 | Resources & Economy | Mana, Focus, Motes, Skyglass, the Deep Current, full cost tables |
| 7 | Equipment Catalogue | Every slot, every item, across all five chapters |
| 8 | The Kindled's Notebook | Side content: world, study, craft, failure |
| 9 | Secret Sequences & Hidden Content | Sequence-gated unlocks |
| 10 | The Turning of the Seasons | Monthly and quarterly live content |
| 11 | The Endgame | The Warden, the Mender, the Wellspring |
| 12 | Replay & Challenge Modes | NG+, speed runs, restricted builds |
| 13 | People and Places | Recurring NPCs, locations, and a short bestiary |
| 14 | A Note on Numbers | Balancing philosophy |
| 15 | Technical Architecture | File structure and types |
| 16 | Implementation Roadmap | Build order |
| 17 | Glossary | Terms |
| 18 | Open Questions | Unresolved design bets |

---

# 0. The Premise

A hundred years ago, the sky cracked. Not metaphorically — there is a visible, jagged seam across the northern horizon that every map still marks, called the Sundering, and on clear nights you can see raw magic leaking out of it in slow, colored drifts, the way smoke leaks from a chimney. Nobody caused it on purpose. Nobody has fully closed it. What it did was flood the world with wild, untaught magic strong enough that ordinary people near the scar started being marked by it — a faint discoloration in the eyes, a resistance to cold or fire that wasn't there before, an unsettling knack for knowing where things are hidden. These people are called the **Kindled**, and you are one of them.

Magic in this world doesn't sort itself into fire, water, air, and earth. It sorts itself into four **Aspects**, each one a different *kind of change* rather than a different substance:

- **Ash** — magic of consumption and transformation. Not "fire magic" so much as the magic of anything being used up, burned, spent, or converted into something else.
- **Root** — magic of growth and connection. Living things binding to living things — healing, entangling, accelerating growth, knitting flesh or vine.
- **Hush** — magic of negation and absence. Silencing, hiding, unmaking, erasing — the magic of things that stop existing, or stop being noticed.
- **Iron** — magic of weight and permanence. Gravity, hardness, anchoring — the magic of things that refuse to change once they've settled.

Every mage is Kindled toward one Aspect first, usually by accident of proximity to the Sundering or family bloodline, and spends the game learning to wield it, then to combine it with the others, and eventually to decide what kind of relationship they want with the wound in the sky that made all of this possible in the first place.

A line from the Conclave's own entry primer, handed to every new student at Hollow Reach, sets the tone we want for the whole game's voice:

> *"You will be told the Sundering is a wound. It is. You will also be told a wound is only ever a bad thing. It isn't. Everything you're about to learn came out of that crack, including you."*

## 0.1 A Short History

**Year 0 — The Sundering.** No agreed cause. The three leading theories, none provable, are taught side by side at the Conclave: a failed working by a since-forgotten order of scholars; a natural fault line in the world finally giving way; or, favored mostly by Hush practitioners, that something on the far side pushed through rather than something on this side breaking out.

**Years 1–12 — The Wild Years.** Magic without instruction. Most of the recorded deaths and disappearances in Hollow Reach's civic ledger date from this period. The four Aspects weren't yet formally distinguished; people just called it all "the sky-sickness" and treated Kindling as closer to an affliction than a gift.

**Year 13 — The First Conclave.** A loose gathering of surviving self-taught Kindled agree, for the first time, on the four-Aspect framework this document uses. The framework is still taught almost unchanged.

**Years 20–60 — The Long Building.** Most of Hollow Reach's Iron-work infrastructure dates from this period — the town wasn't just rebuilt, it was rebuilt to be difficult to destroy a second time.

**Year 74 — The Undercroft Sealing.** The Conclave deliberately seals the undercroft beneath its own halls behind a braid-only lock, after an incident the official record calls "regrettable" and declines to elaborate on further. This is Chapter III's setting.

**Present day, Year 103.** The Sundering has neither widened nor closed in living memory. Most people in Hollow Reach have made a kind of peace with it. The Conclave has not.

---

# 1. Design Pillars

**A school of magic should be a verb, not a noun.** Ash isn't "the fire school," it's "the school of things being consumed." That framing is what lets four Aspects generate genuinely different mechanical behavior instead of four palette-swapped damage types.

**Power should feel discovered, not distributed.** The game should reward a player who tries an unlikely combination of spells before we've told them it works, over a player who reads a patch note.

**Failure should teach the shape of the spell.** A botched casting should fail in a way specific to the Aspect involved — an overcooked Ash spell and a mistimed Hush spell should feel nothing alike when they go wrong.

**Not everywhere is equally magic.** Content should live somewhere for a reason — near the Sundering scar, in a place that's seen a lot of dying (Iron), in an overgrown ruin (Root) — rather than being handed over from a menu.

**Equipment should change the shape of a decision, not just the size of a number.** A ring that reduces Ash cooldowns should change how a player *plays* Ash, not just how fast the same play loops.

**History should be legible in the world, not just in a codex entry.** Year 74's sealing, the Long Building's Iron-work, the Wild Years' body count — all of it should be something a player can stumble into physically, not just read about in a menu.

**The ending is a stance toward the Sundering, not a faction pick.** By the endgame the player has enough mastery to choose whether the wound in the sky should be mastered, healed, or joined.

---

# 2. The Shape of the Game — Five Chapters

## 2.1 Chapter I — First Spark

*Setting: Millhollow, the player's home village, at the edge of the Sundering's visible light. Population roughly two hundred, half of whom have a small, unremarkable magical quirk they don't think of as magic at all.*

The tutorial. The player casts their first real spell by accident — most origin stories in this world involve panic, not intention — and spends the chapter learning the base loop through three simple castings, one lightly flavored toward each of three Aspects, before the fourth (whichever the player is naturally Kindled toward) reveals itself as noticeably easier for them specifically.

**Tasks**

| Task ID | Name | Type | Description |
| --- | --- | --- | --- |
| `catch_your_breath` | Catch Your Breath | Timed (1×) | The inciting incident — the player's first uncontrolled casting, resolved by calming down rather than casting harder. |
| `ember_practice` | Ember Practice | Loop (∞) | Coax a candle flame taller and shorter on command; introductory Ash. |
| `hedge_practice` | Hedge Practice | Loop (∞) | Encourage a hedge to grow half an inch and stop; introductory Root. |
| `stillness_practice` | Stillness Practice | Loop (∞) | Silence a ringing bell early; introductory Hush. |
| `errand_running` | Errand Running | Loop (∞) | Non-magical village chores that quietly build Focus through routine. |

**Spells:** Coax the Ember (Ash), Nudge the Root (Root), Quiet the Bell (Hush) — see §3 for full tier lists.

**Equipment:** Miller's Charm (Focus Gear, +5 Focus).

**Resources:** Mana — baseMax 100, initial 50. Focus — baseMax 30, initial 15. Motes — baseMax ∞, initial 0.

**Notable figure:** Widow Cathal, the player's neighbor, who was Kindled during the Wild Years and never fully recovered her nerve for casting. She recognizes what's happening to the player before they do and is the one who sends them toward Hollow Reach — a small, quiet handoff that the game should not over-dramatize.

## 2.2 Chapter II — The Four Aspects

*Setting: Hollow Reach, a half-abandoned town built directly under the scar, home to the game's central faction, the Conclave. Roughly a third of the buildings are propped up with Iron-work that nobody currently living knows how to repeat.*

The player arrives at the Conclave and is properly taught all four Aspects rather than just the one they stumbled into.

**Tasks**

| Task ID | Name | Type | Unlock |
| --- | --- | --- | --- |
| `ember_practice` | Ember Practice | Loop (∞) | carried over, Conclave-grade instruction |
| `hedge_practice` | Hedge Practice | Loop (∞) | carried over |
| `stillness_practice` | Stillness Practice | Loop (∞) | carried over |
| `stonewatch_practice` | Stonewatch Practice | Loop (∞) | Chapter II unlock; introductory Iron |
| `focus_meditation` | Focus Meditation | Loop (∞) | Complete Catch Your Breath |
| `mote_study` | Mote Study | Loop (∞) | Complete 10 castings of any kind |
| `library_duty` | Library Duty | Loop (∞) | Assist Osrun Fell; small Focus gain, unlocks History side content early |

**Actions**

| Action ID | Name | Type | Unlock |
| --- | --- | --- | --- |
| `cast_ash` / `_root` / `_hush` | Cast a spell | Repeatable (3×) → upgrade | Chapter I complete |
| `cast_iron` | Cast an Iron spell | Repeatable (3×) → upgrade | Chapter II unlock |
| `upgrade_ash` / `_root` / `_hush` / `_iron` | Deepen an Aspect | One-time (5×) | 10 castings of that Aspect |

**Equipment:** Miller's Charm, Conclave Signet (Focus Gear, −1000ms Ash cooldown), Practice Wand (Wardslot, +2 to failed-casting recovery), Wardstone Amulet (Wardslot, +3 Focus). Full details in §7.

**Resources:** Mana — baseMax 100, initial 50. Focus — baseMax 30, initial 15. Motes — baseMax ∞, initial 5. Skyglass (hidden) — baseMax 0, unlock path `skyglass_unlock`.

Chapter II ends on a real decision: Osrun Fell, the Conclave's last archivist, asks the player to either teach Hollow Reach's children what they've learned so far (slows the player's own progress, permanently improves every future Focus-training task in Hollow Reach) or keep their lead and move on. Neither option is marked correct.

**Notable figures introduced:** Osrun Fell (archivist); Tamsin Reeve, a Conclave instructor specializing in Root who lost a hand during the Wild Years to a Bramble Snare she cast on herself by accident and now teaches caution first, technique second; Corvin Ashe, an Ash specialist and the closest thing the Conclave has to a reckless-genius archetype, who will offer to teach the player faster, riskier methods off the books.

## 2.3 Chapter III — Braided Casting

*Setting: the flooded undercroft beneath the Conclave, sealed in Year 74 behind a braid-only lock.*

Two Aspects cast together in the same breath produce something new. Full braid details in §4.

**Tasks:** advanced versions of all four practice loops (higher Motes yield), `mote_study` (advanced), `braid_practice` (Chapter III unlock).

**Actions:** `cast_smolder`, `cast_dormancy`, `cast_heartwood`, `cast_temper` (Repeatable 5×, Chapter III unlock); tier-2 upgrades for all four base Aspects (One-time 10×, 30 castings required).

**Equipment:** Braidstone Ring (Focus Gear, enables braided casting outside the undercroft), Basic Lens and Fine Lens (Farseer's Lens slot). Full details in §7.

**Resources:** Mana — baseMax 100, initial 50. Focus — baseMax 40, initial 20. Motes — baseMax ∞, initial 8. Skyglass — baseMax 30.

**What's down there:** the undercroft is flooded ankle-to-knee depending on the room, lit only by whatever the player brings or casts, and contains the Conclave's own unofficial record of the Year 74 incident — three journals, none complete, none in full agreement with each other about what actually happened when the lock was first sealed.

## 2.4 Chapter IV — Casting Forms

*Setting: no single hub — the chapter moves between the Conclave's ritual hall, the old battlefield at Greyfen (Iron-heavy, ideal for Sustained practice), and the Hollow Reach market (Hush-heavy).*

Any spell can be shaped by *how* it's cast. Full detail in §5.

**Tasks:** `ritual_study`, `wild_practice`, `sustain_training` (all Chapter IV unlock), plus mastery-tier versions of all four base practice loops.

**Actions:** mastery-tier casting for all four Aspects and all four braids (Repeatable 8×); tier-3 upgrades (One-time 15×, 60 castings required).

**Equipment:** Fine Lens (carried over), Basic and Fine Current-Tuner. Full details in §7.

**Resources:** Mana — baseMax 150, initial 75. Focus — baseMax 50, initial 25. Motes — baseMax ∞, initial 12. Skyglass — baseMax 80.

**Notable figure:** Deryn Voss, a Greyfen veteran and unlicensed Iron specialist who fought in a border skirmish decades ago using Sustained Iron workings nobody at the Conclave taught her, and is deeply suspicious of formal instruction as a result. Teaches Sustained-duration casting better than anyone at the Conclave, and will say so.

## 2.5 Chapter V — The Wound Answers

*Setting: determined by which endgame path the player is building toward — the Conclave's high sanctum (Warden), the fracture-map room (Mender), or nowhere on any existing map (Wellspring).*

Full detail in §11. **Endgame Resources:** Skyglass — baseMax 80. The Deep Current (stat) — baseMax 100, initial 20.

---

# 3. The Four Aspects in Detail

Each Aspect below is given six spell tiers rather than four, since by the endgame a dedicated single-Aspect player should have real depth to draw on (see the Single Thread challenge, §12).

## 3.1 Ash — the school of consumption

Ash plays fast and a little reckless — cheap early, steep cost growth later, real risk of an overcast spell doing more than intended.

| Spell | Tier | Description |
| --- | --- | --- |
| Coax the Ember | I | Grow or shrink an existing flame. |
| Kindle's Touch | II | Light something that wasn't burning; low damage, high reliability. |
| Spendthrift's Flare | III | Convert a large amount of Mana into a short, powerful burst; the classic "overcast" spell. |
| The Long Burn | IV | A slow, sustained consumption effect — melts, corrodes, or wears down a target gradually. |
| Second Wind | V | Convert unspent Mana directly into Motes at a punishing but useful rate, at the cost of a brief casting drought afterward. |
| The Last Match | VI | A single, maximal expenditure of nearly all current Mana for an effect scaled to match — the highest ceiling of any Ash spell, and the one most likely to overshoot badly at low Focus. |

*Characteristic failure:* an over-conjugated Ash spell doesn't fizzle, it overshoots — a candle asked to grow becomes a small bonfire, a lock asked to weaken corrodes clean through.

## 3.2 Root — the school of growth

Root is the slow-compounding Aspect — worst early yield, best long-term scaling. Its failures tend to be *too much* growth rather than none at all.

| Spell | Tier | Description |
| --- | --- | --- |
| Nudge the Root | I | Grow a small plant, once. |
| Knit | II | Accelerated minor healing — closes small wounds, mends torn fabric-adjacent materials. |
| Bramble Snare | III | Rapidly grows entangling vines around a target; the game's crowd-control Root spell. |
| The Long Season | IV | Advances a living thing through an entire growth cycle in moments. |
| Grafting | V | Bind two living things together at the growth level — the mechanical basis for Heartwood crafting further down the line, and usable on its own for orchard and garden work. |
| The Deep Root | VI | A slow, wide effect that improves the health of everything living in an area over a long duration; the closest the game gets to a pure support spell. |

*Characteristic failure:* a mistimed Root spell doesn't stop growing on schedule — Bramble Snare cast at low Focus has a habit of not stopping where the caster meant it to.

## 3.3 Hush — the school of negation

Hush is the precision Aspect — narrow effects, cheap, but unforgiving of bad timing.

| Spell | Tier | Description |
| --- | --- | --- |
| Quiet the Bell | I | Mute a small sound source briefly. |
| Unseen Step | II | Brief, minor concealment — not invisibility, more "easy to overlook." |
| Erase | III | Remove a small, specific detail from a surface, object, or, with caution, a memory — the most narratively loaded spell in the game, and the one the Conclave regulates most heavily. |
| The Held Breath | IV | A wide, brief silence — mutes sound and minor magic in an area for a few seconds. |
| The Unspoken Name | V | Temporarily remove a target's ability to be specifically identified or targeted by name-based effects — powerful, narrow, and deeply unsettling to anyone it's cast on. |
| The Absence | VI | The game's most extreme Hush spell — a localized pocket where almost nothing, magical or otherwise, functions for a brief moment. Requires extraordinary Focus and is treated by the Conclave as closer to a weapon than a spell. |

*Characteristic failure:* a mistimed Hush spell doesn't fail to silence something — it silences the wrong thing. Erase cast badly has, on at least one documented occasion, erased the caster's own memory of casting it.

## 3.4 Iron — the school of permanence

Iron is the patient Aspect — the highest base cost, the lowest failure rate, and the only Aspect whose effects don't fade on their own.

| Spell | Tier | Description |
| --- | --- | --- |
| Stonewatch | I | Slightly harden a small object's surface. |
| Anchor | II | Fix an object in place against being moved. |
| Leaden Word | III | Sharply increase an object or creature's weight, briefly. |
| The Settling | IV | Make a change permanent — the spell every Temper-based craft ultimately routes through. |
| Bedrock | V | Extend Anchor's fixing effect to a wide area, stabilizing structures rather than single objects — the spell behind most of Hollow Reach's post-Year-13 architecture. |
| The Unmoved | VI | Render the caster, briefly, nearly impossible to displace by force, magical or physical — the game's premier defensive spell, and the slowest and most expensive casting in the game. |

*Characteristic failure:* Iron rarely fails outright, but when it does, the failure is permanent too — a botched Anchor doesn't just fail to fix something in place, it fixes it in the *wrong* place, for good, without a Mender's intervention.

---

# 4. Braided Casting in Detail

Casting two Aspects in the same breath produces a braid — a new spell family neither parent Aspect can produce alone. Each braid gets three named workings of its own, not just a single headline effect.

## 4.1 Smolder (Ash + Hush)

A burn with no light and no sound.

| Working | Description |
| --- | --- |
| The Slow Ember | Baseline Smolder — hidden, gradual damage over time to a single target. |
| Ashfall | A wider, weaker version that affects an area rather than a point; the Conclave's least favorite Smolder working for exactly the reason you'd expect. |
| The Cold Burn | An advanced Smolder variant that consumes something without any heat at all, used mostly for discreetly destroying documents. |

*Signature quirk:* a Smolder working left unattended long enough eventually makes noise all at once — a balancing safeguard that also plays as a genuine horror beat the first time a player learns it the hard way.

## 4.2 Dormancy (Hush + Root)

Silence laid over growth becomes suspended animation.

| Working | Description |
| --- | --- |
| The Held Season | Baseline Dormancy — suspends a living thing's growth and decay for a set duration. |
| The Quiet Bed | An extended Dormancy variant for safely transporting the wounded, developed originally as battlefield medicine at Greyfen. |
| The Sealed Jar | A precise, small-scale Dormancy working for preserving dangerous specimens; heavily used, and heavily regulated, by the Conclave's research wing. |

*Signature quirk:* things held in Dormancy don't age, but they also don't heal — it buys time, it doesn't spend it productively.

## 4.3 Heartwood (Root + Iron)

Living growth made permanent — bark that hardens like stone, a vine that never withers.

| Working | Description |
| --- | --- |
| The First Graft | Baseline Heartwood — permanently hardens a small living structure. |
| Livingwall | A structural-scale Heartwood working, the source of Hollow Reach's oldest still-growing fortifications. |
| The Quiet Companion | A rare, difficult Heartwood working that produces a small, permanently living object bonded lightly to its caster — half plant, half keepsake. |

*Signature quirk:* a Heartwood object is alive in a very small, very slow way, and reacts — almost imperceptibly, over months — to how it's treated.

## 4.4 Temper (Iron + Ash)

Weight plus consumption is, put plainly, blacksmithing.

| Working | Description |
| --- | --- |
| The First Forging | Baseline Temper — hardens and permanently shapes a worked material; the entry point to all equipment crafting. |
| The Second Firing | A refinement pass that improves an already-Tempered item, the mechanical basis for equipment upgrades throughout the game. |
| The Unbreaking | An advanced, expensive Temper working that makes an item effectively immune to further change, good or bad — a one-way door players should be warned about clearly before they take it. |

*Signature quirk:* unlike the other three braids, Temper is the only one the Conclave actively teaches as a trade rather than treats with suspicion, since half the town's structural Iron-work was Tempered generations ago.

---

# 5. Casting Forms — the deeper layer

Any spell, single-Aspect or braided, can be shaped by *how* it's cast.

**Casting Method:**

- *Instant* — standard cost, standard reliability, the default.
- *Ritual* — slower and more expensive up front, but near-guaranteed and stronger.
- *Wild* — cheaper and faster, but unstable; output varies meaningfully, sometimes weaker, sometimes far stronger.

**Duration:**

- *Instant* — resolves immediately.
- *Delayed* — set now, triggers later on a stated condition; the trap- and ward-setting tool, and the source of most interesting failure stories, since a Delayed spell cast with poor Focus doesn't always trigger on the condition you meant.
- *Sustained* — channeled, draining Mana continuously while active.

**Target:**

- *Outward* — affects the world, standard cost.
- *Inward* — affects the caster, usually cheaper and smaller in scope.

**Worked examples**

| Spell | Method | Duration | Target | Result |
| --- | --- | --- | --- | --- |
| Coax the Ember | Instant | Instant | Outward | The tutorial casting — reliable, cheap, small. |
| Coax the Ember | Wild | Delayed | Inward | A self-ward that might ignite if a stated condition is later met — a fire trap that falls naturally out of the same base spell. |
| Anchor | Ritual | Sustained | Outward | A near-unbreakable, actively maintained fixation — expensive to hold, effectively unbeatable while held. |
| Quiet the Bell | Wild | Instant | Inward | An unpredictable moment of personal concealment, cheap enough to spam, unreliable enough to punish overuse. |

None of these are separate resource tracks; they're modifiers layered onto any Aspect or braid the player already knows, which means four Aspects (24 spells across six tiers), four braids (12 workings), three Methods, three Durations, and two Targets combine into a very large space of usable spells without hand-authoring hundreds of them individually.

---

# 6. Resources & Economy

| Resource | Represents | Behavior |
| --- | --- | --- |
| **Mana** | Raw magical reserve | Spent per casting; regenerates passively and via certain Root-adjacent tasks |
| **Focus** | Concentration and control | Raises reliability, shortens cooldowns; grown mostly through equipment and dedicated training |
| **Motes** | Residue shaken loose by casting, successful or not | Core crafting/conversion currency; converts to Mana at an improvable rate |
| **Skyglass** | Physical shards of the Sundering itself | Found, not farmed; fuels the deepest research and all Temper crafting |
| **The Deep Current** | The world's own slow undertow of raw magic | Accrues passively while away; funds the largest late-game expenditures |

## 6.1 Cost and yield curves

`value = base + (level × factor)`, factor Aspect-specific:

| Aspect | Cost Growth | Yield Growth | Design Intent |
| --- | --- | --- | --- |
| Ash | Steep | Steep early, flattens late | Recklessness should get expensive |
| Root | Shallow | Shallow early, steepens late | Patience should compound |
| Hush | Moderate, spiky | Moderate | Precision, not brute scaling |
| Iron | Shallow | Shallow throughout | Should eventually get cheap to be patient |

## 6.2 Sample base costs, Tier I–III

| Spell | Base Mana Cost | Base Motes Yield | Base Cooldown |
| --- | --- | --- | --- |
| Coax the Ember (Ash I) | 8 | 2 | 2s |
| Spendthrift's Flare (Ash III) | 35 | 6 | 8s |
| Nudge the Root (Root I) | 6 | 1 | 3s |
| Bramble Snare (Root III) | 28 | 4 | 10s |
| Quiet the Bell (Hush I) | 5 | 1 | 1.5s |
| Erase (Hush III) | 30 | 3 | 12s |
| Stonewatch (Iron I) | 10 | 1 | 3s |
| Leaden Word (Iron III) | 32 | 3 | 9s |

## 6.3 Failure economy

Failed castings default to a 15% chance when Focus is insufficient for a spell's complexity, falling to 5% with mastery, never to zero. A failed casting costs a little Mana and produces a little in Motes, on the theory that even a bad spell leaves some residue worth collecting.

---

# 7. Equipment Catalogue

## 7.1 Focus Gear slot

| Item | Effect | Unlock |
| --- | --- | --- |
| Miller's Charm | +5 Focus | Chapter I |
| Conclave Signet | −1000ms Ash cooldown | 20 Ash castings |
| Braidstone Ring | Enables braided casting outside the undercroft | Chapter III unlock |
| The Steady Hand | +8 Focus, reduces Wild-method variance slightly | 40 Wild Practice completions |

## 7.2 Wardslot

| Item | Effect | Unlock |
| --- | --- | --- |
| Practice Wand | +2 to failed-casting recovery | Chapter I |
| Wardstone Amulet | +3 Focus | 50 practice loops of any kind |
| The Archivist's Ward | Reduces the severity of failures on Delayed-duration spells specifically | Complete The Lesson of Iron (§8.4) |

## 7.3 Farseer's Lens slot

| Item | Effect | Unlock |
| --- | --- | --- |
| Basic Lens | Reveals a braid's hidden secondary effect before casting | Chapter III unlock |
| Fine Lens | +2 Focus, reveals all secondary effects | 30 Braid Practice |
| The Long Sight | Reveals fracture locations on the world map for Mender-path content | Complete the Mender's Working (§9.1) |

## 7.4 Current-Tuner slot

| Item | Effect | Unlock |
| --- | --- | --- |
| Basic Current-Tuner | Converts Motes to Mana at a better rate | Chapter IV unlock |
| Fine Current-Tuner | +3 Focus, better conversion | 40 Braid Practice |
| The Undertow Fork | Enables tapping the Deep Current directly for large one-time expenditures | Chapter V unlock |

---

# 8. The Kindled's Notebook — side content

## 8.1 Found in the world

| Entry | Description | Reward | Unlock |
| --- | --- | --- | --- |
| The Chimney Primer | A scorched Ash primer wedged in a Millhollow chimney | +5 Mana, earlier Ash upgrade | Chapter I complete |
| The Patient Well | A well-cover carved with a rhyme that's quietly a working Iron ward | +3 Focus, earlier Iron upgrade | Chapter I complete |
| The Unwitnessed Garden | A patch of flowers that never wilts — a Root spell nobody remembered to turn off | +2 Focus, earlier Root upgrade | Chapter II unlock |
| The Missing Verse | A folk song with a verse everyone insists was never there — a Hush working, decades old | +5 Mana, earlier Hush upgrade | Chapter II unlock |
| Widow Cathal's Box | A locked box the player's Chapter I neighbor never explains; opening it (gently) reveals a Wild-Years-era Ash journal | +5 Motes, small Corvin Ashe reputation gain | Chapter III unlock |

## 8.2 Found in study

| Entry | Description | Reward | Unlock |
| --- | --- | --- | --- |
| Ashen History | Study the history of Ash-craft in Hollow Reach | +3 Focus, earlier Ash upgrade | Chapter II unlock |
| Root History | Study the history of Root-craft | +3 Focus, earlier Root upgrade | Chapter II unlock |
| Hush History | Study the history of Hush-craft, most of which is, appropriately, missing | +2 Focus, earlier Hush upgrade | Chapter III unlock |
| Iron History | Study the history of Iron-craft, the best-documented of the four | +5 Mana, earlier Iron upgrade | Chapter III unlock |
| The Year 74 Journals | Read all three conflicting undercroft-sealing journals and reconcile what actually happened | +10 Focus, Mender-path lore flag set | Chapter III unlock |

## 8.3 Found in craft

| Entry | Description | Reward | Unlock |
| --- | --- | --- | --- |
| The Charm-Maker's Hunt | Locate the materials for the Conclave Signet | Conclave Signet unlocked | Chapter II unlock |
| The Braidstone Hunt | Recover the components for a Braidstone Ring | Braidstone Ring unlocked | Chapter III unlock |
| The Farseer's Commission | Commission a Farseer's Lens from the last lens-grinder in Hollow Reach | Fine Lens unlocked early | Chapter III unlock |
| Deryn's Old Kit | Repair a set of Greyfen-era Iron tools for Deryn Voss | The Steady Hand unlocked early | Chapter IV unlock |

## 8.4 Found in failure

| Entry | Description | Reward | Unlock |
| --- | --- | --- | --- |
| The Successful Misfire | Complete five successful castings without a single failure | +10 Motes, Mote Study unlocked | Chapter II unlock |
| The Lesson of Ash | Survive three deliberate Ash failures under supervision | +3 Focus, "Steady Hand" passive unlocked | Chapter III unlock |
| The Lesson of Iron | Deliberately mis-Anchor an object and successfully correct it with Root | +5 Focus, Mender-track flag set, The Archivist's Ward unlocked | Chapter IV unlock |
| The Lesson of Hush | Deliberately cast Erase badly and recover what was lost through study rather than magic | +5 Focus, Wellspring-track flag set | Chapter IV unlock |

---

# 9. Secret Sequences & Hidden Content

## 9.1 Sequence-gated secrets

| Sequence | Requirement | Reward |
| --- | --- | --- |
| The Fourfold Rite | Cast all four Aspects, plain and unmodified, in a fixed order, ten times each, without a single failed casting between | +15 Focus, +20 Mana, Warden path progress |
| The Mender's Working | Complete ten braided castings across at least three braids, then stabilize one fractured patch of the Sundering using only Delayed-duration spells | +10 Focus, The Long Sight unlocked, Mender path progress |
| The Wellspring Test | Hold five distinct spells active at once, spanning all four Aspects | +20 Focus, +30 Mana, Wellspring path progress |

## 9.2 Hidden resources

| Resource | Unlock Path | Reward |
| --- | --- | --- |
| Skyglass | Complete five clean castings, then three dedicated study sessions | +20 Skyglass, advanced spell effects unlocked |
| The Deep Current | Sustain two Aspects simultaneously for an extended stretch, then complete three "listening" tasks | +15 Deep Current, hybrid-spell effects enabled |

## 9.3 Secret equipment

| Item | Unlock Path | Effect |
| --- | --- | --- |
| The Archivist's Charm | Complete the Fourfold Rite + 5 dedicated study sessions | +10 Focus, −500ms cooldown on all castings |
| The Secret Braidstone | Complete the Mender's Working + 20 Braid Practice | Enables combining any two Aspects for a bonus, undocumented effect |
| Widow Cathal's Ashwork | Fully restore the journal from §8.1 and return it to her | A unique, non-upgradeable Focus Gear item with no listed stat effect — its purpose is left for players to discover |

---

# 10. The Turning of the Seasons — live content

## 10.1 Monthly events

| Month | Theme | Bonus During | Permanent Carry-Over |
| --- | --- | --- | --- |
| Cinderfall | Anniversary of a fire local legend insists went right, not wrong | Ash yields ×2 | +10% base Mana regeneration |
| The Long Bloom | Root-aligned | Braided-casting costs −1 | Lasting discount on braided casting |
| Quiet Week | Hush-aligned | Timing-sensitive equipment more available | +5 Focus |
| Deep Rest | Iron-aligned; deliberately the slowest event | Lowest yield, largest gain of any monthly event | 1.5× Iron yield, permanent |

## 10.2 Quarterly events

| Season | Theme | Special Mechanic |
| --- | --- | --- |
| The Steady Season | All four Aspects yield evenly | Balance meter; perfect balance gives bonus rewards |
| The Widening | The Sundering flares; the most dangerous event in the calendar | Failure rates rise, but so do rewards for succeeding anyway |

## 10.3 Weekly rotations

A small rotating goal — cast a target number of a given Aspect, sustain a spell for a set duration, collect a Motes target — that resolves in seven days and rolls forward if missed.

---

# 11. The Endgame — Three Answers to the Sundering

## 11.1 The Warden

*Master all four Aspects to deep fluency through sheer volume — a hundred-plus clean castings of each.*

The Warden hasn't found anything new about the Sundering; they've simply become good enough at all four Aspects to hold them in balance, the way the world's magic behaved, briefly, right after the crack first opened and before anyone had specialized. Post-ending content leans into precision — zero-failure challenge tasks and a full tier of Temper-based equipment.

## 11.2 The Mender

*Complete the braided-casting path, recover the Long Sight, and successfully stabilize at least one fractured patch of the Sundering itself.*

The Mender's insight is that the Sundering isn't a wound that has to stay open or get sealed all at once — it can be treated, patch by patch. Post-ending content is investigative: new fractures to find and stabilize, each with a small, specific consequence for the world once treated.

## 11.3 The Wellspring

*Hold five simultaneous spells across all four Aspects — the Wellspring Test — then choose to cast something that draws on no known Aspect at all.*

The hardest ending, and the one that should feel destabilizing rather than triumphant to reach: the player stops drawing on the Sundering's magic and becomes, in some small way, a second source of it. Post-ending content is the game's only generative system — player-assembled spells from a constrained vocabulary of learned Aspects and Casting Forms, resolved by underlying rules rather than pre-authored outcomes.

---

# 12. Replay & Challenge Modes

**Second Kindling (New Game+):** restart with equipment and Temper workings intact, higher starting Mana and Focus, and immediate access to whichever ending's post-content was achieved.

**The Quiet Run (speed challenge):** finish Chapters I–V within a fixed time window from unmodified starting resources; rewards a small permanent boost across every resource on completion.

**Bare-Handed (equipment-restricted challenge):** finish using only what's available by the end of Chapter I — no Temper crafting at all.

**Single Thread (specialization challenge):** commit to one Aspect for the entire run — Ash-only fast and punishing, Iron-only slow and nearly failure-proof. With six tiers per Aspect (§3), each Single Thread run should feel like a complete build rather than a novelty restriction.

**Unwitnessed (Hush-flavored challenge):** complete the game leaving as little trace as possible — no permanent Iron workings, no structural changes, tracked via a simple "footprint" counter that most other runs never see.

---

# 13. People and Places

## 13.1 Notable figures

| Name | Role | Notes |
| --- | --- | --- |
| Osrun Fell | Conclave archivist, Hollow Reach | Presents the Chapter II teaching-vs-progress choice; too old to safely cast |
| Widow Cathal | Millhollow neighbor | Wild-Years Kindled, never recovered her nerve for casting; sends the player to Hollow Reach |
| Tamsin Reeve | Conclave Root instructor | Lost a hand to her own Bramble Snare during the Wild Years; teaches caution first |
| Corvin Ashe | Conclave Ash instructor | Reckless-genius archetype; offers faster, riskier off-the-books methods |
| Deryn Voss | Greyfen veteran, unlicensed Iron specialist | Distrusts formal instruction; best teacher of Sustained casting in the game |

## 13.2 Locations

| Name | Notes |
| --- | --- |
| Millhollow | Player's home village, population ~200; site of Chapter I |
| Hollow Reach | Conclave seat, built under the scar; central hub from Chapter II onward |
| The Conclave | The world's closest thing to formal magical education; regulates Hush heavily |
| The Undercroft | Flooded chamber beneath the Conclave, sealed Year 74 behind a braid-only lock |
| Greyfen | Old battlefield, Iron-heavy; preferred site for Sustained-duration practice |

## 13.3 A short bestiary

Not every fracture-adjacent creature in this world is hostile, and the ones that are should be interesting for reasons tied to the Aspect system rather than generic stat blocks.

| Creature | Aspect Affinity | Notes |
| --- | --- | --- |
| Emberling | Ash | Small, harmless scavengers drawn to any unattended Ash working; a nuisance more than a threat, and a decent early indicator that a Smolder has been left running too long. |
| Bramblehound | Root | Feral dogs that wandered too close to an unmaintained Bramble Snare generations ago and never fully separated from the vines; slow, easy to outrun, hard to fully remove from a territory. |
| The Unremembered | Hush | Rare, unsettling encounters — people or animals so thoroughly affected by long-term Hush exposure that they've become genuinely difficult for others to recall clearly after the fact. Treated with real narrative weight, not as a monster-of-the-week. |
| Greyfen Sentinel | Iron | Old battlefield constructs, Anchored in place a lifetime ago and never released; effectively permanent fixtures of the landscape rather than combat encounters. |

---

# 14. A Note on Numbers

All costs and yields scale with level using the same general shape — `value = base + (level × factor)` — but the factor is Aspect-specific per §6, and that specificity is the single easiest thing to lose during a balancing pass. Failure variance should be tuned so a middling player sees a failed casting roughly once every six to eight actions early on — often enough to have opinions about it, never often enough to become the headline experience. Skyglass and Deep Current gains should always feel rare enough to screenshot.

---

# 15. Technical Architecture

```
gameData/
├── index.ts               # module registration
├── _template.ts            # starter module template
├── categories.ts           # Aspect / braid / chapter definitions
├── resources.ts            # Mana, Focus, Motes, Skyglass, Deep Current
├── tasks.ts                # practice loops and timed tasks per Aspect
├── actions.ts               # casting actions, braids, upgrades
├── castingForms.ts           # Method / Duration / Target modifiers
├── equipment.ts                # focus gear, wards, Farseer's Lens, etc.
├── converters.ts                 # Motes→Mana and related conversions
├── bestiary.ts                    # fracture-adjacent creatures, §13.3
└── sundered-design-document.md    # this document
```

```typescript
export interface CastingFormModifier {
  id: string;
  axis: 'method' | 'duration' | 'target';
  costMultiplier: number;
  effectMultiplier: number;
  variance?: number;          // for Wild-method unpredictability
  triggerCondition?: string;  // for Delayed-duration spells
}

export interface UnlockPath {
  id: string;
  effect: 'modify_max_resource_flat' | 'increase_stat_flat' | 'set_flag';
  resourceId?: string;
  target?: string;
  amount: number;
  condition?: {
    type: 'tasksCompleted' | 'aspectFluencyLevel' | 'levelReached';
    value: number;
  };
}
```

---

# 16. Implementation Roadmap

| Stage | Focus | Notes |
| --- | --- | --- |
| Weeks 1–2 | Core loop, Chapter I | First Spark tutorial; three early castings plus one Kindled-specific one |
| Weeks 3–5 | Chapter II — the four Aspects | Full practice/cast/upgrade tracks; establish per-Aspect failure texture |
| Weeks 6–8 | Chapter III — braided casting | Smolder, Dormancy, Heartwood, Temper; Motes and Focus tuning |
| Weeks 9–11 | Chapter IV — Casting Forms | `castingForms.ts`; highest-risk stage, needs the most playtesting |
| Weeks 12–13 | Chapter V — the three endings | Warden / Mender / Wellspring and their post-ending content |
| Weeks 14–15 | Side content | The Notebook (§8), Secret Sequences (§9) |
| Weeks 16–17 | Bestiary & world texture | §13.3 creatures, environmental storytelling pass |
| Weeks 18+ | Live content | Seasonal calendar (§10), weekly rotations, challenge modes (§12) |

---

# 17. Glossary

**Kindled** — anyone touched by the Sundering closely enough to sense and use magic; the player.
**The Sundering** — the crack in the sky that leaked raw magic into the world roughly a century ago.
**Aspect** — one of the four schools of magic (Ash, Root, Hush, Iron), each defined by a kind of change rather than a substance.
**Braid** — the four named effects produced by casting two Aspects together (Smolder, Dormancy, Heartwood, Temper).
**Casting Method** — Instant / Ritual / Wild; how forcefully or stably a spell is delivered.
**Duration** — Instant / Delayed / Sustained; when and how long a spell's effect lasts.
**Target** — Outward / Inward; whether a spell acts on the world or the caster.
**Skyglass** — physical shards of the Sundering, the game's hidden late-game resource.
**The Deep Current** — the slow undertow of raw magic beneath the world, tapped only by masters.
**The Wild Years** — the twelve-year period immediately after the Sundering, before the Aspect framework existed.

---

# 18. Open Questions

- Should Wild-method variance have a floor, or is "occasionally nothing happens" acceptable for a Mana-costing action?
- Does Osrun Fell's choice at the end of Chapter II need more than one visible callback later, or is a single quiet echo enough?
- Is the Wellspring ending too obscure without external hints? It's meant to feel unbelievable-until-you-do-it, not simply hidden.
- Should Greyfen and Deryn Voss get their own short side arc, given how much Chapter IV leans on them for Sustained practice, or stay purely functional?
- Does the bestiary (§13.3) need combat mechanics at all, or is it stronger kept mostly non-combat, in line with the game's overall emphasis on discovery over conflict?

Happy to start on Chapter I's content files next, or take another pass at any section above first.
