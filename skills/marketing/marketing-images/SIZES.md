# Image sizes by platform

Sizes for social posts, profile and listing banners, each marked **verified** (with the official page, checked 2026-10-18) or **source only** ([coreyhaines31/marketingskills, image], not checked against the platform; X's docs could not be reached). Recheck a source-only size on the platform before a launch. Store art: Google Play's feature graphic and App Store screenshots are in [aso](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/aso/SKILL.md) (its ANDROID.md has the 1024 x 500 feature graphic); paid ad sizes are [ad-creative](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/ad-creative/SKILL.md); share images (OG) are [seo LINK-PREVIEWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/seo/LINK-PREVIEWS.md).

## Social posts

| Platform | Size | Ratio | Status |
|---|---|---|---|
| LinkedIn feed image | 1200 x 627 | 1.91:1 | Verified: "Use a 1.91:1 ratio (1200 x 627 pixels)" (https://www.linkedin.com/help/linkedin/answer/a563309) |
| X large image card | 1200 x 675 | 16:9 | Source only |
| Instagram feed | 1080 x 1080 (1080 x 1350 at 4:5 "also strong") | 1:1 | Source only |
| Instagram Stories | 1080 x 1920 | 9:16 | Source only |
| Facebook link share | 1200 x 630 | 1.91:1 | Source only |

LinkedIn also says (https://www.linkedin.com/help/linkedin/answer/a563309, https://www.linkedin.com/help/linkedin/answer/a564109):

- A post image must be more than 200 pixels wide, or it shows as a small thumbnail on the left.
- Post images can be GIF, JPEG, PNG or WEBP, up to 36 megapixels; "GIFs are not supported on profile or background photos".

## Banners and listings

| Placement | Size | Status |
|---|---|---|
| LinkedIn Page cover | 1512 x 256 minimum and recommended | Verified (a563309). The source's "1128x191; LinkedIn recommends up to 4200x700" is stale |
| LinkedIn Page logo | 268 x 268 minimum, 400 x 400 recommended | Verified (a563309) |
| LinkedIn Life tab main image | 1128 x 376 | Verified (a563309) |
| LinkedIn personal cover | 1584 x 396 (4:1, keep the safe zone in the centre) | Source only |
| X header | 1500 x 500 (3:1), partly covered by the avatar | Source only |
| Product Hunt gallery | 1270 x 760 (5:3), up to 6 images | Source only; launch assets are [product-launch PRODUCT-HUNT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/product-launch/PRODUCT-HUNT.md) |
| G2 profile | 1280 x 720 (16:9), product screenshots preferred | Source only |
| GitHub social preview | 1280 x 640 (2:1), shows in link cards | Source only |

LinkedIn Page images (a563309): "All images must be PNG or JPEG files and have a maximum size of 3MB"; keep key details away from the edges, especially the lower-right corner; a transparent logo shows on white, so check it on light and dark.

## Banner practices

[coreyhaines31/marketingskills, image]

- **Keep text minimal:** banners are seen small on phones.
- **Centre what matters:** edges get cropped differently per device; on X, keep it clear of the avatar.
- **Show the product:** the source says "real UI screenshots outperform abstract graphics on directory listings" (its claim, no data). Directories get real screenshots with light annotation; profiles get brand colours, a tagline and an optional product shot.
- **Match the brand:** the same colours, fonts and logo placement everywhere.
- **Update seasonally:** "stale banners signal an inactive product".
- **Test at display size:** zoom out and check it still reads.

## One design, many sizes

[coreyhaines31/marketingskills, image]

1. Make the concept at the largest size you need.
2. Resize per platform (Canva Magic Resize, or crop by hand).
3. Add text in post, not in the generation.
4. Export each platform's size.

## Prove it

Every exported file's pixel size matches its row here (`sips -g pixelWidth -g pixelHeight file.png`); LinkedIn Page images are PNG or JPEG under 3 MB; any size marked source only was rechecked on the platform before launch, or the plan says it wasn't; each banner was viewed at its real display size, on light and dark where the logo is transparent.
