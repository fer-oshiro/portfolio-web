import { useDesktopRTC } from '../hooks/useDesktopRTC'

const ROOM_ID = '123'
export const Desktop = () => {
  const { connected, gyro } = useDesktopRTC()

  return (
    <div style={{ padding: 20 }}>
      <h2>Desktop (WebRTC)</h2>
      <p>
        Status:{' '}
        {connected === 'connected'
          ? '🟢 P2P Conectado'
          : '🔴 Aguardando mobile...'}
      </p>
      {connected === 'connected' && (
        <div
          style={{ fontSize: '1.5rem', padding: 20, border: '1px solid white' }}
        >
          <p>Alpha: {gyro.alpha?.toFixed(2)}°</p>
          <p>Beta: {gyro.beta?.toFixed(2)}°</p>
          <p>Gamma: {gyro.gamma?.toFixed(2)}°</p>
        </div>
      )}
    </div>
  )
}
