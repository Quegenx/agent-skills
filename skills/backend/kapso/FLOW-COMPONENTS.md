# Flow screens, bindings and actions

The component model from [gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md], with the current target schema checked against [Kapso Flow JSON](https://docs.kapso.ai/docs/whatsapp/flows/flow-json). Source-specific component counts, size ceilings and claimed 7.3-only guarantees were not independently confirmed and are not retained as platform limits.

## Screens and data

- Declare the screens, their identities, layout and the data each screen consumes. A dynamic routing_model declares permitted transitions; a next screen's required data must be supplied by its transition or endpoint response. [gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]
- Keep data references, form values and literal values distinct. The source uses data/form references and cross-screen global references; match the actual version's declaration and expression grammar before changing bindings. [gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]
- The dynamic asset joined literal text with a reference while its own spec required the nested-expression form. Do not copy that conflicting interpolation as validated syntax. Reuse a validated expression from the current schema/source rather than inventing a new one. [gokapso/agent-skills, integrate-whatsapp/assets/dynamic-flow.json; references/whatsapp-flows-spec.md]

## Component choices

[gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]

| Job | Source component family |
|---|---|
| Heading, body and helper content | Text headings/body/captions and rich text |
| Written answers | TextInput and TextArea |
| Choices | Dropdown, RadioButtonsGroup, CheckboxGroup and ChipsSelector |
| Calendar input | DatePicker and CalendarPicker |
| Consent or an acknowledged choice | OptIn |
| Images and attachments | Image, PhotoPicker and DocumentPicker |
| Action and submission | Footer, EmbeddedLink and NavigationList |
| Conditional presentation | If and Switch |

This is the supplied component taxonomy, not a promise that every component is accepted by every schema version. Read the actual current component schema for required properties, supported actions and media/selection limits before authoring it. [Kapso Flow JSON](https://docs.kapso.ai/docs/whatsapp/flows/flow-json)

## Actions and forms

- The source distinguishes navigate, data_exchange and complete: local navigation, a server exchange and finishing the form are different actions. Carry only the required declared payload to the next boundary. [gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]
- Give form inputs unique names in their scope and bind the action payload to the intended form/data value. Check required/optional state and errors in the target version; a plausible rendered form does not establish that submission bindings are valid. [gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]
- WhatsApp's native component contract applies inside WhatsApp. It does not replace the owner's web/app controls, typography or layout. [repository owner-design policy]

## Prove it

[gokapso/agent-skills, integrate-whatsapp/references/whatsapp-flows-spec.md]

Every referenced screen, form name and data key exists; the transition supplies the destination's data; the actual schema accepts the chosen component/action; completion produces the endpoint contract in [FLOWS.md](FLOWS.md). No unverified numeric ceiling or version guarantee is presented as current platform behavior.
