# Platform limits

Character, hashtag, link and media limits per platform. The table started from coreyhaines31/marketingskills `social` (`references/platform-limits.md`, MIT) and was checked against each platform's documentation; every figure is tagged **official** (with its page) or **source** (the source's figure, not found in official docs). Where the source differs from the official page, the official form is given with what the source said. When an agent or scheduler publishes through an API, the API's limit applies even where the app allows more.

**Contents:** [X](#x) · [LinkedIn](#linkedin) · [Instagram](#instagram) · [Threads](#threads) · [TikTok](#tiktok) · [YouTube](#youtube) · [Facebook](#facebook) · [Pinterest](#pinterest) · [Usage tips](#usage-tips) · [Prove it](#prove-it)

## X

- **Post length (official):** 280 characters as standard. "Longer posts allow subscribers to post up to 25,000 characters. You can also compose longer posts in a quote or reply." (About X Premium, https://help.x.com/en/using-x/x-premium). The page offers longer posts to "subscribers" and names no tier (X Premium has Basic, Premium and Premium+, https://help.x.com/en/using-x/x-premium-faq); the source said "25,000 (Premium+)", which reads as the top tier only. Check the tier list before promising it on Basic. X's How to Post page (https://help.x.com/en/using-x/how-to-post) still says "up to 4,000 characters" in its steps, which is stale: the X API changelog says "longform Posts with a length of 25k instead of 4k" (https://docs.x.com/changelog).
- **Media (official):** up to 4 media items per post (How to Post).
- **Hashtags (source):** no official limit; 1 to 2 recommended.

## LinkedIn

- **Post length (official):** "Posts can contain up to 3,000 characters"; past that, write an article (LinkedIn Help a528176, Post and share updates).
- **Documents (official):** DOC, DOCX, PPT, PPTX or PDF; "The file size cannot exceed 100 MB. The page limit is 300 pages." (LinkedIn Help a564109, Media file types). The source's carousel file says only "Upload as PDF".
- **Source figures:** no official hashtag limit, 3 to 5 recommended; about 210 characters visible before "more".

## Instagram

- **Hashtags (official):** 5 per reel or post in the app ("Starting today, Instagram will allow up to 5 hashtags in a reel or post", Instagram @creators, 18 Dec 2025, https://www.instagram.com/p/DSalTolEbvf). The IG User Media API page still says "Maximum 2200 characters, 30 hashtags, and 20 @ tags." (https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media).
- **Caption (official):** 2,200 characters (API page above).
- **Carousels:** 20 slides in the app (source); through the API "Carousels can have up to 10 total images, vidoes, or a mix" (official, API page above). A scheduler or agent publishing through the API is capped at 10.
- **API extras (official):** up to 3 collaborators; an optional `is_ai_generated` self-disclosure of AI use, "Not available for carousel children".
- **Source figures:** 3 to 5 hashtags recommended; about 125 characters visible before "more"; slides at 1080×1350 (4:5) ([CAROUSELS.md](CAROUSELS.md#platform-notes)).

## Threads

All official, from the Threads API Posts page (https://developers.facebook.com/docs/threads/posts) unless noted:

- "Text posts are limited to 500 characters"; emojis count as their UTF-8 bytes.
- "Only one topic tag is allowed per post"; a tag is "at least 1 character and no more than 50 characters", with no "." or "&".
- "The number of links is restricted to 5 or less"; from 22 Dec 2025 more than 5 fail with `THREADS_API__LINK_LIMIT_EXCEEDED`.
- "Carousels are limited to 20 images, videos, or a mix", with at least 2.
- A text attachment adds "up to 10,000 characters of text" (Meta newsroom, https://about.fb.com/news/2025/09/attach-text-threads-posts-share-longer-perspectives).
- Source: the first 1 to 2 lines show without expanding; "The platform is not hashtag-driven."

## TikTok

- **Caption:** through the Content Posting API, `title` "The maximum length is 2200 in UTF-16 runes." (official, https://developers.tiktok.com/doc/content-posting-api-reference-direct-post). The source gives 4,000 in the app; no official in-app figure was found and 4,000 comes from third parties.
- **Hashtags:** the source says 5 "since August 2025"; no TikTok newsroom or support page says so, and third parties report only an in-app pop-up. Treat it as reported, not official.
- **API flags (official, same page):** `brand_content_toggle` (a required field; true marks a paid partnership promoting a third-party business), `brand_organic_toggle` (true when the video promotes the creator's own business), `is_aigc` (AI-generated label); errors include `spam_risk_too_many_posts` (the API's daily post cap for the user) and `unaudited_client_can_only_post_to_private_accounts`.
- **Source figures:** 3 to 5 hashtags recommended; about 150 characters visible before "more".

## YouTube

- **Hashtags (official):** "If a video or playlist has more than 60 hashtags, we'll ignore each hashtag on that content. Over-tagging may result in the removal of your video" (https://support.google.com/youtube/answer/6390658). The source said a maximum of 15 above which YouTube ignores all hashtags; the help page gives 60 and no 15 cap.
- **Hashtag display (official):** up to three hashtags considered most engaging may appear by the title. The source and this file formerly promised the first three would appear automatically; neither order nor display is guaranteed (https://support.google.com/youtube/answer/6390658?hl=en).
- **Source figures (not verified):** title 100 characters (about 70 visible), description 5,000, about 100 characters before "Show more"; 1 to 5 hashtags for Shorts; 3 to 5 recommended. [coreyhaines31/marketingskills, social/references/platform-limits.md]

## Facebook

Source figures, not verified: no official hashtag limit, 1 to 2 recommended; 63,206 characters per post; 40 to 80 characters "ideal for engagement".

## Pinterest

Source figures, not verified: 20 hashtags per pin, 2 to 5 recommended; title 100 characters, description 500; about 50 characters visible before "More" on desktop. The source adds "Pinterest has deprioritized hashtags. Focus on keywords as natural sentences within the description".

## Usage tips

`[coreyhaines31/marketingskills, social]`

- Hashtags count against character limits on all platforms.
- Front-load the message before the "more" truncation point.
- On Instagram and TikTok, fewer hashtags now outperform hashtag-stuffing.
- On LinkedIn, hashtags at the end of the post perform better than inline.
- On Facebook, hashtags have minimal impact on reach; use sparingly.

## Prove it

Before a post ships, its character count (Threads counting emoji as UTF-8 bytes), hashtag count, link count and media count are checked against the limit for how it will be published: Instagram with at most 5 hashtags (the API page still lists 30) and, through the API, at most 10 carousel items; Threads with one topic tag and at most 5 links; TikTok API captions at most 2,200 UTF-16 runes; YouTube well under 60 hashtags; LinkedIn under 3,000 characters and documents under 100 MB and 300 pages; and any figure quoted in a plan says whether it is official or the source's.
