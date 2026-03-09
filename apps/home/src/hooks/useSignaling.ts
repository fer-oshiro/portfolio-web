import useWebSocket from 'react-use-websocket'

export const useSignaling = (url: string) => {
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(url, {
    onOpen: () => sendJsonMessage({ action: 'join', roomId: '123' }),
  })

  const send = (action: string, payload: any) =>
    sendJsonMessage({ action, ...payload })

  return { signal: lastJsonMessage as any, send }
}
