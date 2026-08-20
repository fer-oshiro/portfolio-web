import { describe, expect, it } from 'vitest'

import {
  resolveSceneControllerIntent,
  type SceneControllerState,
} from './scene-controller-model'

const roomState: SceneControllerState = {
  currentScene: 'room',
  phase: 'idle',
  focus: 'default',
}

describe('scene controller model', () => {
  it('mantém hotspots locais como intenções exclusivas de câmera', () => {
    expect(
      resolveSceneControllerIntent(roomState, {
        type: 'hotspotActivated',
        hotspot: 'pc',
      }),
    ).toEqual([{ type: 'focusCamera', focus: 'pc' }])

    expect(
      resolveSceneControllerIntent(
        { ...roomState, focus: 'pc' },
        { type: 'hotspotActivated', hotspot: 'board' },
      ),
    ).toEqual([{ type: 'focusCamera', focus: 'board' }])
  })

  it('converte os hotspots de draw e cat em foco e navegação', () => {
    expect(
      resolveSceneControllerIntent(roomState, {
        type: 'hotspotActivated',
        hotspot: 'draw',
      }),
    ).toEqual([
      { type: 'focusCamera', focus: 'draw' },
      { type: 'navigate', targetScene: 'draw', effect: 'brush' },
    ])

    expect(
      resolveSceneControllerIntent(roomState, {
        type: 'hotspotActivated',
        hotspot: 'cat',
      }),
    ).toEqual([
      { type: 'focusCamera', focus: 'cat' },
      { type: 'navigate', targetScene: 'cat', effect: 'cat' },
    ])
  })

  it('deriva a volta para room da cena atual e restaura o foco', () => {
    expect(
      resolveSceneControllerIntent(
        { currentScene: 'draw', phase: 'idle', focus: 'draw' },
        { type: 'sceneRequested', targetScene: 'room' },
      ),
    ).toEqual([
      { type: 'focusCamera', focus: 'default' },
      { type: 'navigate', targetScene: 'room', effect: 'brush' },
    ])

    expect(
      resolveSceneControllerIntent(
        { currentScene: 'cat', phase: 'idle', focus: 'cat' },
        { type: 'sceneRequested', targetScene: 'room' },
      ),
    ).toEqual([
      { type: 'focusCamera', focus: 'default' },
      { type: 'navigate', targetScene: 'room', effect: 'cat' },
    ])
  })

  it('rejeita caminhos que não pertencem ao grafo da UI', () => {
    expect(
      resolveSceneControllerIntent(
        { currentScene: 'draw', phase: 'idle', focus: 'draw' },
        { type: 'sceneRequested', targetScene: 'cat' },
      ),
    ).toEqual([])

    expect(
      resolveSceneControllerIntent(roomState, {
        type: 'sceneRequested',
        targetScene: 'room',
      }),
    ).toEqual([])
  })

  it.each(['covering', 'covered', 'revealing'] as const)(
    'bloqueia novas intenções durante %s',
    (phase) => {
      expect(
        resolveSceneControllerIntent(
          { ...roomState, phase },
          { type: 'hotspotActivated', hotspot: 'cat' },
        ),
      ).toEqual([])

      expect(
        resolveSceneControllerIntent(
          { ...roomState, phase },
          { type: 'cameraResetRequested' },
        ),
      ).toEqual([])
    },
  )

  it('ignora hotspots fora da cena room', () => {
    expect(
      resolveSceneControllerIntent(
        { currentScene: 'draw', phase: 'idle', focus: 'draw' },
        { type: 'hotspotActivated', hotspot: 'pc' },
      ),
    ).toEqual([])
  })

  it('não emite comandos redundantes de câmera', () => {
    expect(
      resolveSceneControllerIntent(
        { ...roomState, focus: 'pc' },
        { type: 'hotspotActivated', hotspot: 'pc' },
      ),
    ).toEqual([])

    expect(
      resolveSceneControllerIntent(roomState, {
        type: 'cameraResetRequested',
      }),
    ).toEqual([])
  })
})
