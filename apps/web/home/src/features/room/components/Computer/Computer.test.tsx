import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const htmlRoot = vi.hoisted(() => ({
  children: undefined as ReactNode | undefined,
}))

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: ReactNode }) => {
    htmlRoot.children = children
    return null
  },
}))

vi.mock('leva', () => ({
  useControls: (
    groupOrSchema: string | Record<string, unknown>,
    groupedSchema?: Record<string, unknown>,
  ) => {
    const schema =
      typeof groupOrSchema === 'string' ? groupedSchema : groupOrSchema

    return Object.fromEntries(
      Object.entries(schema ?? {}).map(([key, control]) => [
        key,
        typeof control === 'object' && control && 'value' in control
          ? control.value
          : control,
      ]),
    )
  },
}))

import { RealtimeContextProvider } from '../../../remote-control/realtime/realtime-context'
import { RealtimeClient } from '../../../remote-control/realtime/realtime-client'
import { useStore } from '../../../../store'
import { Computer } from './Computer'

afterEach(() => {
  useStore.getState().setCamera('default')
  htmlRoot.children = undefined
})

describe('Computer', () => {
  it('repassa realtime para a raiz React criada pelo Html', () => {
    const realtimeClient = new RealtimeClient()
    useStore.getState().setCamera('pc')

    renderToStaticMarkup(
      <RealtimeContextProvider client={realtimeClient}>
        <Computer />
      </RealtimeContextProvider>,
    )

    expect(htmlRoot.children).toBeDefined()
    expect(() => renderToStaticMarkup(<>{htmlRoot.children}</>)).not.toThrow()
  })
})
