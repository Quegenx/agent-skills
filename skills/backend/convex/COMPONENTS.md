# Components

Component guidance comes from [get-convex/agent-skills, convex-create-component and its local-components.md, packaged-components.md, hybrid-components.md and advanced-patterns.md references], corrected against [component authoring](https://docs.convex.dev/components/authoring). Prefer an already installed component that solves the actual job before authoring a new dependency.

## Choose the boundary

- **A component owns a reusable backend capability.** Choose local development, a separately packaged component or an explicitly configured hybrid based on how it is consumed and shared. Do not add a component merely to split one cohesive function. [get-convex/agent-skills, convex-create-component]
- **Keep its schema and generated API within its own boundary.** A component cannot directly query parent-app tables. Pass parent identifiers as boundary data, commonly strings, and resolve app ownership in the app wrapper. Do not treat a parent ID as the component's own table ID. [get-convex/agent-skills, convex-create-component, references/local-components.md]
- **Inspect package exports and codegen/build order.** A packaged or hybrid component needs the documented config export, generated references and build outputs consumed by the parent; local authoring and published-package resolution are different paths. Do not import a missing generated artifact or assume a source-only package is publishable. [get-convex/agent-skills, convex-create-component/references/packaged-components.md, references/hybrid-components.md]

## App wrappers, handles and validators

- **Keep app authentication and data ownership in its wrapper.** The component's client helper can compose calls, but a public app entry point still enforces identity, parent membership and output exposure. [get-convex/agent-skills, convex-create-component]
- **Use function handles for the documented cross-boundary callback contract.** Resolve the handle through the supported Convex API rather than passing an ordinary JavaScript closure or assuming the component can import app code. [get-convex/agent-skills, convex-create-component/references/advanced-patterns.md]
- **Derive validators from the owned schema when appropriate.** The source uses schema.doc, schema.id and v.nullable; check installed exports and generated typing. Its getNotification example read args.id from a handler that never bound args, so do not copy that incomplete snippet. [get-convex/agent-skills, convex-create-component/references/advanced-patterns.md; https://docs.convex.dev/functions/validation]
- **Expose reusable test registration helpers for packaged components.** Consumers should register the component in the mock backend explicitly, with matching schema/modules, rather than relying on an app's private test setup. [get-convex/agent-skills, convex-create-component/references/packaged-components.md]

## HTTP and environment

- **Components can declare their own typed environment.** The parent supplies declared values; arbitrary access to the parent's environment remains outside the component boundary. The source's blanket claim that components cannot read environment is stale. [https://docs.convex.dev/components/authoring#environment-variables]
- **Components can define HTTP routes.** Current authoring supports component http.ts and mounting with app.use and httpPrefix. An app-owned route/wrapper still handles app-specific authorization and data. The source said components could never register routes and must always delegate all HTTP routing to the app. [https://docs.convex.dev/components/authoring#http-actions; https://docs.convex.dev/functions/http-actions]

## Prove it

The selected local/package/hybrid layout has a working generated API and documented build order; parent data is accessed only through authorized app wrappers; callbacks, declared environment and HTTP prefixes match installed types; component registration is explicit in the permitted verification setup. Do not run builds or tests without the user's request. [get-convex/agent-skills, convex-create-component; user standing rules]
