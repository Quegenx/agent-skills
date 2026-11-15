# Check the artifact people will install

Build Artifacts adds content and usability checks to [release provenance](RELEASES.md) and [npm packaging](NPM-PACKAGES.md). A signed artifact can still omit a required file; source-tree tests can pass while an installed package fails. Use the target project's existing build and package tools, within the authorized verification scope. [wdm0006/python-skills, build-artifacts/SKILL.md]

## Make missing required input fail

[wdm0006/python-skills, build-artifacts, A script that warns and exits 0; Bound the artifact size; Derive the file list]

- Fail a build when a required declared input is missing. A warning is appropriate only when the resulting artifact still supports the promised behavior without that input.
- Check package contents against the real manifest, entry points and required dependency or asset references. Prefer deriving the list to maintaining another copy of it.
- Where duplicated dependency metadata is unavoidable, compare normalized lists against their owning source. Two hand-maintained lists can agree on the same omission.
- An upper size limit controls cost, not completeness. An unexpectedly small artifact can signal missing input, but contents and reachable entry points provide stronger evidence than a size floor alone.

## Verify outside the source tree

[wdm0006/python-skills, build-artifacts, Verify the artifact then publish]

Inspect the actual archive or package entries, then install or load that artifact somewhere the source checkout is absent from the load path. Exercise a real exported symbol or command and its expected result. Resolving a top-level name or listing files alone does not establish that the packaged program works.

Keep these checks after packaging and before any authorized upload. The artifact checked is the artifact promoted; do not rebuild it afterward. Use the [npm owner](NPM-PACKAGES.md#pack-once-publish-the-tarball) for pack-once publication and the [release owner](RELEASES.md#verify-before-promotion) for signatures and provenance.

## Keep served build output with its source

[wdm0006/python-skills, build-artifacts, Committed build outputs; Release scripts]

When a committed bundle is what the product serves, editing its source alone leaves the shipped program unchanged. Regenerate that output with the source change. A rebuild-and-diff gate is meaningful only with a pinned builder and confirmed deterministic output in the relevant environments; report an unestablished reproducibility condition rather than assuming byte equality.

Read structured version and dependency metadata with the appropriate parser from an existing runtime. A platform-specific shell regex can fail while merely extracting a version. Compare the artifact's reported version with the manifest that governs it.

## Prove it

[wdm0006/python-skills, build-artifacts, Checklist]

Required input failures are visible, the artifact contains the entry points and their required files, and an isolated installed copy exercised the promised behavior. Source and committed served output agree under the stated builder conditions. Record which checks actually ran, the exact artifact identity and any unverified platform or installation path before publication.
