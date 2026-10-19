# Grafana plugin frontend

Sources: [grafana/skills, plugin-bundle-size, grafana-scenes and react-19-plugin-migration], checked against Grafana Plugin Tools, React and Scenes documentation. These rules apply inside a Grafana-hosted plugin. They do not replace the owner's app-ui, landing-page-ui or agent-chat-ui design; generic React behavior stays in [react](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md).

## Measure the startup graph

[grafana/skills, plugin-bundle-size]

- Identify whether the plugin is an app, panel or data source and read its real entry point, routes, extension registrations, editors and shared providers.
- Compare production output with the same configuration before and after an authorized change. Development size, total package closure and the initial loaded graph are different measurements.
- Inspect synchronous imports reachable from the entry, including barrels and side-effect singletons. A lazy edge does not remove a second eager path to the same feature.
- Split at useful feature boundaries: app entry, routes, exposed extensions, then heavy tabs or registries when the measurements justify it. Do not impose the source's chunk-count or percentage-reduction targets as universal requirements.
- Keep shared providers at the boundaries that need them. Extracting initialization must preserve actual completion and failure semantics; do not copy the sample's eager initialized flag as proof that asynchronous setup finished.

## Loading boundaries

[https://grafana.com/developers/plugin-tools/key-concepts/best-practices]

Pass a lazy root page directly to `setRootPage`: Grafana supplies its loading state. Config pages registered with `addConfigPage` and other components need their own Suspense boundary. The source generically wrapped the root page too; the official boundary is more specific.

[https://grafana.com/developers/plugin-tools/how-to-guides/ui-extensions/expose-a-component]

Lazy exposed components need their own boundary and any plugin-specific providers. Check the app and routes are already lazy; an eager import elsewhere can defeat the exposed-component split. Verify extension identity and its plugin metadata together.

[https://react.dev/reference/react/lazy]

React.lazy expects a promise resolving to a component in `.default`. A named-export adapter can supply that shape. The source's troubleshooting guide required esModuleInterop universally; React.lazy itself does not require that compiler option. Match the actual module/export and bundler configuration rather than changing compiler settings by rote.

## Scenes composition

[grafana/skills, grafana-scenes; https://github.com/grafana/scenes/blob/main/docusaurus/docs/scene-app.md]

Use SceneApp and SceneAppPage for an app's page graph, with `getScene` supplying the scene. An EmbeddedScene composes layouts, panels, data, variables and a time range. The documented `useSceneApp` hook preserves the app instance for URL synchronization and navigation state; do not recreate that identity accidentally on each render.

[https://github.com/grafana/scenes/blob/main/docusaurus/docs/core-concepts.md]

Custom scene objects extend SceneObjectBase, expose a renderer through Component, read model state through `model.useState()` and update it through `setState`. Keep the scene model and its rendering contract together. Query runners, transformations, variable sets and page drilldowns must match the installed Scenes API; source examples are not permission to guess a constructor or enum.

## Host React compatibility

[https://grafana.com/developers/plugin-tools/migration-guides/update-from-grafana-versions/migrate-12_x-to-13_x]

- Grafana shares one runtime React instance with plugins. A local package bump does not select the host runtime; make the code compatible with the supported host range and do not bundle a different React instance.
- Inspect the actual create-plugin scaffold and its update diff before adopting its JSX-runtime externalization path. Verify `grafanaDependency` against the supported host versions rather than copying a minimum from an old recipe.
- A compatibility scanner is a lead, not a verdict: multi-version dependencies can produce false positives, and class-component defaultProps differs from removed function-component behavior.
- Use the actual component prop types when repairing handlers. The source's blanket checkbox ChangeEvent-to-FormEvent replacement is not a substitute for the selected Grafana component's type.
- Preserve the lockfile and install policy. The source claimed Yarn v2+ automatically installs peers; Yarn requires the consuming ancestry to provide compatible peers. [https://github.com/yarnpkg/berry/blob/master/packages/docusaurus/docs/advanced/01-general-reference/lexicon.mdx]

## Grafana-scoped presentation

[https://grafana.com/developers/plugin-tools/key-concepts/best-practices]

Use Grafana UI components, Emotion and Grafana theme tokens inside a plugin so it follows its host. Avoid global styles that affect other plugins. This is a host-specific contract, not a generic product-design replacement. Use the existing [package installation boundary](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/PACKAGE-INSTALLS.md) for any dependency change.

## Prove it

The production entry graph and loaded-on-navigation chunks match the intended boundaries; no eager path or provider dependency defeats the split; root/config/extension loading boundaries match Grafana's contract; scene state survives navigation as intended; and compatibility evidence names the actual supported Grafana/React versions and installed dependency contract. Run-time or build checks happen only when authorized, with their actual results reported.
