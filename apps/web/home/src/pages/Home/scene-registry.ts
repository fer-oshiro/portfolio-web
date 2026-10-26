import { createSceneRegistry } from '../../features/scene-navigation'

// Room stays eager as the initial scene; Draw is DOM and always ready.
export const sceneRegistry = createSceneRegistry<'cat'>({
  cat: () =>
    import('../../features/cat-game').then(({ CatScene, CatGameOverlay }) => ({
      Scene: CatScene,
      Overlay: CatGameOverlay,
    })),
})
