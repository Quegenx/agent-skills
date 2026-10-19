# DeepEval and Confident tracing in TypeScript

Sources: [confident-ai/eval-skills, eval-grade and eval-trace] and [confident-ai/deepeval, deepeval, deepeval-tracing and deepeval-otel], checked against current mode, tracing and OTLP documentation. This is a selected-platform operator reference; generic checks, judges, datasets and release decisions remain with the other files in this skill.

## Select what the metric measures

[confident-ai/deepeval, deepeval, references/metrics.md and traced-evals.md]

- Start from an observed product failure and the evidence available to grade it. Match single-turn versus conversation inputs.
- Put component diagnostics on the component's actual span and keep the end-to-end outcome primary.
- Relevance is not factual correctness. The source mapped "Does it answer correctly?" to AnswerRelevancyMetric; the official metric measures relevance to the input. Use a task-specific correctness criterion and evidence for correctness. [https://deepeval.com/docs/metrics-answer-relevancy]
- Check TaskCompletionMetric against the installed version and selected mode. Current implementation requires a trace, while the official page also discusses a system_one path without one; an input/output table alone cannot settle every execution path. [https://deepeval.com/docs/metrics-task-completion]
- Real cases remain primary; generated goldens are reviewed gap fillers. The source's claim that generated cases are generally less biased does not displace [the case rules](HARNESS.md#the-cases).

## Evaluation modes

[https://deepeval.com/docs/evaluation-eval-modes]

Current TypeScript mode configuration uses `evalMode`:

| Mode | Meaning |
|---|---|
| `llm` | LLM grading |
| `hybrid` | System One path with a possible LLM fallback; retain the fallback reason |
| `system_one` | Jev-only, without LLM fallback |

Validate the requested mode and metric support in the installed version. The source adapter treated every value other than jev as an LLM branch, including hybrid and typos; that is not explicit mode selection. Jev confidence expresses decisiveness, not measured accuracy. JevEval remains Jev-backed and GEval LLM-backed. [https://deepeval.com/docs/metrics-jev-eval]

Local orchestration does not mean local or free inference. Current hosted plans have feature limits; the source's blanket free reporting/monitoring claim does not establish account entitlement. [https://www.confident-ai.com/pricing]

## Node instrumentation

[https://github.com/confident-ai/confident-trace/blob/main/typescript/README.md]

- Current upstream Node support is 22 or newer. Check the installed release and supported adapter rather than assuming source-main behavior was published.
- Automatic instrumentation needs preload plus initialization. Bundled SDKs need their supported manual adapter path.
- Preserve an application's existing OpenTelemetry provider ownership; do not replace it or silently create a duplicate pipeline.
- Complete or close streams before shutdown, then flush and inspect the received trace.
- Content capture defaults on in this source with a 16 KiB limit. Configure redaction or opt out at the capture boundary to preserve the repo's [telemetry privacy rule](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/SKILL.md#the-rules); those controls do not automatically govern unrelated native instrumentors.
- Current default export retains AI spans and their parents. The source's instruction to discard all non-AI spans is too broad and can discard genuine parent context.

## Raw OTLP and encoding

[https://www.confident-ai.com/docs/integrations/opentelemetry]

Raw OTLP/HTTP can reach Confident AI without the deepeval package. Select the actual US, EU or self-hosted deployment and its documented credential header; the source said there are exactly two destinations and inferred an unknown key's region. Do not guess a destination from an unfamiliar credential.

[https://github.com/open-telemetry/opentelemetry-proto/blob/main/opentelemetry/proto/common/v1/common.proto]

OTLP AnyValue includes arrays and KeyValueList. The source's "OTLP has no map type" claim confuses the wire representation with an SDK or backend field contract. Encode a specific content field as its installed SDK/backend requires; do not invent a universal JSON-string requirement for all OTLP attributes.

[https://www.confident-ai.com/docs/integrations/opentelemetry/manual-instrumentation]

Use native OTel span names and the current manual mapping for the selected operation. The supplied registry claimed `confident.span.name` overrides the native name and used `base` for a generic type; current manual docs use native names and `custom`, while another first-party skill page still uses the old generic spelling. Prefer the installed contract and retain that discrepancy rather than copying a static attribute catalogue.

## Prove it

The installed metric supports the selected inputs and mode; fallback is visible; correctness is not inferred from relevance; a received trace preserves real parentage and permitted content; streams finish before shutdown; actual deployment and field encoding are explicit; and neither local orchestration nor exporter acceptance is reported as free inference or verified hosted delivery.
