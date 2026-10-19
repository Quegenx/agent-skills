# Podcast pitching and guest prep

Getting onto a podcast and walking in prepared, copied from coreyhaines31/marketingskills `public-relations` (MIT); the prep method is "Distilled and adapted from ai-visibility-skills by Knowatoa (MIT), reused with credit" (https://github.com/Knowatoa/ai-visibility-skills). The source's reason to prep hard: "Episodes get transcribed, show notes get published, and both get crawled and cited by AI assistants". That is the source's claim, not a measured mechanism; how AI answers pick sources is [ai-search-visibility SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ai-search-visibility/SKILL.md).

## Pitching a podcast

[coreyhaines31/marketingskills, public-relations]

1. **Listen to 3 episodes:** "non-negotiable".
2. **Find the host's preferred channel** (X DM, email, guest form).
3. **Pitch a topic, not yourself:** "I'd love to come on and talk about [specific angle]", not "I'd love to be a guest".
4. **Bring evidence:** links to other appearances, your unique angle, what listeners will learn.
5. **Make it easy:** bio, headshot and suggested questions in the pitch.

## Context to load

[coreyhaines31/marketingskills, public-relations] Read `.agents/product-context.md` for the company, positioning and ICP. It usually lacks the guest's story bank, so ask in one batch, not a drip:

1. What did you build before this that comes up in conversation?
2. What are 2 to 3 stories you tell well, with real numbers attached?
3. What's one opinion you hold that most people in your space disagree with?

Offer to save the answers into the context file. Also establish, only if missing: the podcast name or URL, whether the guest appeared before (get that episode's link: it anchors the progression and the callbacks), and roughly when they record.

## Research order

[coreyhaines31/marketingskills, public-relations] Each source is a fallback for the last:

1. **The RSS feed first:** full descriptions, chapter markers, guest links, dates. Large feeds may truncate, so check that the oldest episodes you need made it.
2. **The show's episode list** for anything the feed missed. Older episodes often lazy-load with JavaScript; if pagination returns nothing, note the gap and move on.
3. **The Apple Podcasts show page:** reliably renders the latest ~8 episodes with full descriptions.
4. **Web search** for stray episodes, the hosts and the show's reputation.

Don't fetch every episode page: descriptions and chapter lists are almost always enough. Pull a full transcript only for an episode that is central (a debate the guest should have a position on); check the feed for published transcript links.

## What to extract

[coreyhaines31/marketingskills, public-relations]

- **Recent threads** (last ~3 months or 6 to 8 episodes): per-episode summaries, then the questions the hosts keep returning to. "Threads matter more than individual episodes; they predict the questions the guest will get."
- **Show progression** since the guest's last appearance, or over ~12 to 18 months: the phases and the point where the focus shifted; whether the show re-invites guests; whether hosts launched side projects.
- **Host profiles:** day job, background, what they're building, handles. Good sources are the show's about page, hosts' sites, LinkedIn, and episodes where the hosts guest on other shows. If a host shares the guest's first name, flag it and keep every reference unambiguous.
- **Prior appearance recap** (if returning): what was discussed, rough timestamps, how much airtime the guest's current company got.

## The brief

[coreyhaines31/marketingskills, public-relations] A markdown file, plus the short version in chat; "a doc they'll skim before recording, not a report":

1. **Big picture:** what kind of show this is now, and one paragraph on how the guest should position themselves.
2. **Show progression:** the phases since the last appearance or the show's start.
3. **Recent episodes:** per-episode notes, then the recurring threads.
4. **Guest angles:** the guest's stories mapped onto the show's threads, callbacks to any prior appearance, and 2 to 3 "pocket" stories with numbers ready.
5. **The hosts:** profiles plus where each host's world overlaps the guest's.
6. **Gaps:** what couldn't be retrieved, and offers to fill it.

Map the story bank onto the threads; "One well-chosen contrarian take stands out most on shows that have converged on a consensus."

**Say it in liftable form:** coach the guest to put "the company name next to the category ('we build X, the Y for Z'), and numbers spoken aloud, not gestured at." Offer, but don't auto-run: transcribing the prior episode, pulling one pivotal transcript, or drafting likely Q&A.

## Prove it

- The pitch names a specific topic, shows 3 episodes were heard, and carries bio, headshot and suggested questions.
- The brief has all six sections, every recurring thread is backed by named episodes, and each guest angle maps to a thread with a story that has a real number.
- Gaps are listed rather than guessed, and a host who shares the guest's first name is flagged.
