# Verifiable releases

A production deploy should be able to answer, from evidence and not from trust: which source commit and build produced this artifact, and has anyone changed it since? Without that, a compromised CI step, a stolen registry token or a hand-pushed image looks exactly like a normal release.

## Bind the artifact to its build

- **Identify artifacts by digest,** never by a mutable tag: `registry/app@sha256:...`. A tag can be moved to another image after it was tested; a digest can't.
- **Record provenance at build time:** a signed statement (SLSA provenance, in-toto format) saying this digest was built from repository X at commit Y by workflow Z, with these inputs. GitHub's `actions/attest-build-provenance` produces one per artifact; other CI systems have equivalents.
- **Build in CI only, from a clean checkout,** with pinned dependency versions (lockfiles) and pinned actions or tool versions (by commit SHA for third-party CI actions). An artifact built on a laptop has no trustworthy provenance.
- Attach a software bill of materials (SBOM) to the same digest, so a later vulnerability can be traced to the releases that contain it.
- npm packages: pack once, publish that tarball with trusted publishing, and get provenance automatically; see [NPM-PACKAGES.md](NPM-PACKAGES.md).

## Cached build outputs

[React Doctor, run-parity] A cached artifact (a baseline, a build output reused by later runs) is evidence only while it can be checked again. The complete producer/input identity, per-record verification, exact provenance shape and write-once procedure is owned by [cached baseline provenance](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/BASE-HEAD-PARITY.md#cached-baselines).

## Sign with the build's identity, not a long-lived key

Keyless signing (Sigstore) uses the CI job's short-lived OIDC identity instead of a private key someone has to store and rotate:

```bash
# in the release workflow, after pushing the image
cosign sign --yes registry.example.com/app@sha256:<digest>

# a blob (a CLI binary, a tarball) gets a bundle file next to it
cosign sign-blob app.tar.gz --bundle app.tar.gz.sigstore.json --yes
```

The signature carries a certificate naming the workflow that signed it and is recorded in a public transparency log, so a signature made outside that workflow can't pass the identity check, and every signing event is auditable after the fact.

## Verify before promotion

Verification checks **who** signed, not only that a signature exists:

```bash
cosign verify registry.example.com/app@sha256:<digest> \
  --certificate-identity "https://github.com/ORG/REPO/.github/workflows/release.yml@refs/heads/main" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"

cosign verify-blob app.tar.gz --bundle app.tar.gz.sigstore.json \
  --certificate-identity "https://github.com/ORG/REPO/.github/workflows/release.yml@refs/heads/main" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```

- **Verify at every promotion gate** (staging to production) and, where the platform supports it, at admission: the cluster or runtime refuses images that don't verify against the expected identity (a Kubernetes admission policy, a deploy step that fails closed).
- **Pin the identity to the protected branch and the release workflow,** not just the repository: otherwise any workflow on any branch, including one in a pull request, can produce a valid signature.
- **Check the provenance's claims too:** the source repository and commit are the ones you expect, and the builder is your CI, not a self-hosted runner nobody controls.
- **Fail closed.** A missing or invalid signature blocks the deploy; there's no "deploy anyway" flag in the pipeline. Emergency releases go through the same signing path, just faster.

## Verifying without network access

Air-gapped or restricted environments can't reach the transparency log at deploy time. Ship the evidence with the artifact (the bundle includes the signature, certificate and the log's inclusion proof) and verify offline against a trusted root you distribute deliberately:

```bash
cosign verify --offline=true --local-image ./saved-image \
  --trusted-root ./trusted_root.json \
  --certificate-identity "$CERT_IDENTITY" --certificate-oidc-issuer "$CERT_OIDC_ISSUER"
```

The trusted root changes over time: refresh the copy on a schedule through a reviewed channel, and treat an outdated root as a verification failure, not a warning.

## Witnessing releases

For software others depend on, publish each release's digest and provenance to an append-only log (the public transparency log does this for signatures) and let independent parties check that everyone sees the same history. A client that records the latest checkpoint it saw can detect a log that later shows a different version of the past (a split view), which turns a silent targeted compromise into a detectable one.

## Prove it

Push an image to the registry by hand (not through CI) under the release tag and show that deployment refuses it; then deploy the CI-built digest and show it passes. Change one byte of a released blob and show `verify-blob` fails.
