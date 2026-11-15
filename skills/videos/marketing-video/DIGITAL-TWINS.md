# Evaluate a subject-specific digital twin

An optional evaluation workflow from [MengTo/Skills, digital-twin/references/judging.md, references/voice.md and references/references.md]. Use it when an authorized person's generated face or voice must remain recognizable across revisions. [AVATARS.md](AVATARS.md) owns avatar selection and recorded agreement; no model, price, API version or source creator's appearance is a universal default here.

## Keep identity evidence separate from generation

Record whose likeness/voice is used, who agreed, the permitted task and which supplied assets belong to that person. For multiple people, keep each person's references and agreement distinct. Preserve capture provenance and distinguish real subject recordings from generated examples. Public availability of a picture does not establish permission or asset rights. [MengTo/Skills, digital-twin/references/consent.md and references/references.md; existing AVATARS.md]

Reserve real reference material that never enters conditioning, including a different capture day where available. Evaluate face appearance, voice resemblance and lip-sync as separate questions; a convincing face does not establish the voice or mouth timing. Name concrete differences such as proportions, eye/lid shape, age cues, speaking rhythm or vowel character before changing a generation. Keep the subject's actual identity constraints separate from arbitrary lighting, styling and room preferences. [MengTo/Skills, digital-twin/references/judging.md; references/voice.md; references/identity-template.md]

## Make comparisons controlled and repeatable

Compare the same real line with the previous and proposed generated voice. Use several speaking rhythms and a held-out sentence, rather than scoring a sentence used to condition the model. When comparing avatar engines, feed the same audio so voice performance does not change alongside lip-sync. Keep a revision record of references, prompts/settings and observed differences, changing one consequential variable at a time. [MengTo/Skills, digital-twin/references/judging.md, same-line comparisons; references/voice.md; references/video.md]

Consistent preprocessing can reduce a channel confound; it does not remove room, microphone or recording differences. Inspect both the untreated evidence and the comparison path before attributing a mismatch to identity. Reference counts and subject/room allocation must fit the selected service's actual current limit; the source's conflicting fixed counts are not a reusable budget. [MengTo/Skills, digital-twin/references/voice.md; references/references.md; scripts/make_round.py]

## Use measurements as diagnostics

Pitch, spectral balance, rate and embedding similarity can help locate a difference when their input, window, preprocessing and scope are recorded. They do not certify identity. The source's fixed pitch range, weighted score, cosine cutoff and passing grade are local heuristics; do not turn them into validated acceptance thresholds or generalize them across speakers. Keep timestamps tied to the original audio even when analysis excludes silence. [MengTo/Skills, digital-twin/scripts/voice/score_voice.py and scripts/voice/scan_dataset.py; references/voice.md]

Have the subject compare the real and generated results and approve the intended output. Inspect speaking frames and held-out views, not only a flattering still. Separate a subject's preference from a measured result, and retain unresolved differences explicitly. Do not label generated demo footage as proof of a real person's approval. [MengTo/Skills, digital-twin/references/judging.md; references/audit.md; references/stills.md]

## Prove it

Each subject's agreement and asset provenance are recorded. Conditioning and held-out sets are distinguishable; face, voice and lip-sync judgments have separate evidence; same-line comparisons identify the actual tested inputs and revisions. The subject's decision and remaining differences are visible. Report metric limits, unavailable services and unperformed listening/visual review; source scripts and example scores were not runtime validation of this result. [MengTo/Skills, digital-twin/references/consent.md; references/judging.md; references/voice.md]
