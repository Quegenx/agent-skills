# Designing an end-to-end journey

The journey contract below comes from the owner's AGENTS.md. Framework-specific setup, selectors and tool comparisons stay in their selected implementation references.

## Journey contract

[owner AGENTS.md, End-to-End and Acceptance Tests]

- Cover one coherent user journey per test.
- Write steps as plain-language instructions a teammate could follow without reading the implementation. Describe user intent and observable outcomes, not selectors, component names, internal APIs, or arbitrary waits.
- Give each step one purpose and stopping point. Keep actions and assertions separate. Use visible labels and business context to disambiguate actions.
- Make every assertion specific enough to pass or fail objectively. Require exact wording only when the wording is part of the behavior.
- Keep secrets out of test definitions, output, and reports.
- Report the exact validation performed and its actual result. Do not claim coverage for tests that were not created, updated, and run.

## Prove it

The journey names the user intent, separate actions and observable checks. The chosen installed framework and the evidence actually obtained are explicit; missing execution is reported as unverified. Framework setup, selectors, repeat counts and CLI flags come from that framework's own skill, not another runner's defaults. [owner AGENTS.md, End-to-End and Acceptance Tests]
