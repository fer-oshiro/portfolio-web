import { useEffect } from 'react'

const NOTICE_DURATION_MS = 5_000

export function SceneFailureNotice({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, NOTICE_DURATION_MS)
    return () => window.clearTimeout(id)
  }, [onDismiss])

  return (
    <p
      role="status"
      style={{
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        borderRadius: '20px',
        backgroundColor: '#e6b092',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      Não foi possível carregar. Tente novamente.
    </p>
  )
}
