import { SceneRoot } from '../../scene-navigation'

type CatSceneProps = {
  active: boolean
}

export function CatScene({ active }: CatSceneProps) {
  return <SceneRoot active={active} />
}
