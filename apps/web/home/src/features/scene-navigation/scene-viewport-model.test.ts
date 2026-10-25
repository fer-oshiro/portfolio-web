import * as THREE from 'three'
import { describe, expect, it } from 'vitest'

import {
  filterActiveSceneHits,
  isInActiveScene,
  markSceneRoot,
  selectSceneViewport,
} from './scene-viewport-model'

function createSceneRoot(active: boolean) {
  const root = new THREE.Group()
  markSceneRoot(root)
  root.visible = active
  return root
}

function hit(object: THREE.Object3D) {
  return { object } as THREE.Intersection
}

describe('selectSceneViewport', () => {
  it('mostra o viewport e renderiza enquanto a sala está ativa', () => {
    expect(
      selectSceneViewport({ currentScene: 'room', phase: 'idle' }),
    ).toEqual({ visible: true, frameloop: 'always' })
  })

  it('mostra o viewport e renderiza enquanto o gato está ativo', () => {
    expect(selectSceneViewport({ currentScene: 'cat', phase: 'idle' })).toEqual(
      { visible: true, frameloop: 'always' },
    )
  })

  it('oculta o viewport e pausa o frameloop com o desenho ativo', () => {
    expect(
      selectSceneViewport({ currentScene: 'draw', phase: 'idle' }),
    ).toEqual({ visible: false, frameloop: 'never' })
  })

  it('mantém o frameloop durante a saída do desenho', () => {
    expect(
      selectSceneViewport({ currentScene: 'draw', phase: 'covering' }),
    ).toEqual({ visible: false, frameloop: 'always' })
    expect(
      selectSceneViewport({ currentScene: 'draw', phase: 'covered' }),
    ).toEqual({ visible: false, frameloop: 'always' })
  })

  it('só pausa depois que a revelação do desenho termina', () => {
    expect(
      selectSceneViewport({ currentScene: 'draw', phase: 'revealing' }),
    ).toEqual({ visible: false, frameloop: 'always' })
  })
})

describe('isInActiveScene', () => {
  it('aceita objetos de uma raiz ativa, mesmo quando o próprio objeto é invisível', () => {
    const root = createSceneRoot(true)
    const hitbox = new THREE.Mesh()
    hitbox.visible = false
    root.add(new THREE.Group().add(hitbox))

    expect(isInActiveScene(hitbox)).toBe(true)
  })

  it('rejeita objetos de uma raiz inativa', () => {
    const root = createSceneRoot(false)
    const mesh = new THREE.Mesh()
    root.add(mesh)

    expect(isInActiveScene(mesh)).toBe(false)
  })

  it('aceita objetos fora de qualquer raiz de cena', () => {
    const scene = new THREE.Scene()
    const mesh = new THREE.Mesh()
    scene.add(mesh)

    expect(isInActiveScene(mesh)).toBe(true)
  })

  it('usa a raiz de cena mais próxima', () => {
    const outer = createSceneRoot(false)
    const inner = createSceneRoot(true)
    const mesh = new THREE.Mesh()
    outer.add(inner.add(mesh))

    expect(isInActiveScene(mesh)).toBe(true)
  })
})

describe('filterActiveSceneHits', () => {
  it('descarta interseções da cena inativa e preserva a ordem', () => {
    const room = createSceneRoot(false)
    const cat = createSceneRoot(true)
    const roomHitbox = new THREE.Mesh()
    const catNear = new THREE.Mesh()
    const catFar = new THREE.Mesh()
    room.add(roomHitbox)
    cat.add(catNear, catFar)

    const hits = [hit(catNear), hit(roomHitbox), hit(catFar)]

    expect(filterActiveSceneHits(hits)).toEqual([hit(catNear), hit(catFar)])
  })
})
