# Remotion Player in a React app

Embed a composition preview with `Player` from `@remotion/player` when the product needs an interactive video preview. From the supplied [remotion-dev/skills](https://github.com/remotion-dev/skills), remotion-saas/player, checked against Remotion's [dynamic metadata](https://www.remotion.dev/docs/dynamic-metadata) and [media rendering guidance](https://www.remotion.dev/docs/client-side-rendering/migration). The composition's timing, metadata callback, captions, fonts, media and output contracts have one owner in [make-video REMOTION.md](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/REMOTION.md). Product layout remains [app-ui](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md)'s responsibility.

## Pass the preview inputs explicitly

[remotion-dev/skills, remotion-saas/player:8-33]; official [Player API](https://www.remotion.dev/docs/player/player) and [metadata guidance](https://www.remotion.dev/docs/dynamic-metadata).

Pass the composition component, `inputProps`, `durationInFrames`, `fps`, `compositionWidth` and `compositionHeight` to the Player. Enable `controls` when the preview should expose playback controls. Keep those values synchronized with the current inputs. A composition registration's `calculateMetadata` does not automatically resolve the Player's props.

For data-dependent previews, reuse the [composition metadata callback](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/REMOTION.md#resolve-metadata-through-a-callback), resolve it for the current inputs, and supply its resulting metadata and props to the Player when ready. Keep asynchronous work and stale-result handling under React's existing [Effect rules](EFFECTS-AND-STATE.md). Do not let an older metadata result replace a newer preview.

## Choose the export path separately

[remotion-dev/skills, remotion-saas/rendering]; official [rendering comparison](https://www.remotion.dev/docs/compare-ssr) and [browser rendering migration](https://www.remotion.dev/docs/client-side-rendering/migration).

Embedding a preview does not choose how the app exports a video. Select the render target for the app's environment and use that target's official setup guide. Keep the preview and export on the same composition and resolved inputs. Check the [framework's media and output requirements](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/REMOTION.md#select-media-and-alpha-output-for-the-render-target) for that renderer; a media component that plays in the Player may need migration for browser export.

## Prove it

Change an input that affects duration or dimensions and confirm the Player updates with the matching resolved props. Change inputs while metadata is pending and confirm an obsolete result cannot replace the current preview. Compare the preview with an export made through the chosen renderer, including media, fonts, captions and the final frame. Follow the composition owner's [Prove it](https://github.com/Quegenx/agent-skills/blob/main/skills/videos/make-video/REMOTION.md#prove-it) for the film itself.
