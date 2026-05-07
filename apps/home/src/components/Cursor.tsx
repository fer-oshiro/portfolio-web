export const Cursor = ({ x, y }: { x: string; y: string }) => {
  console.log('cursor', x, y)
  return (
    <div
      style={{
        position: 'fixed',
        width: '10px',
        height: '10px',
        borderRadius: '100%',
        backgroundColor: 'purple',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        transition: 'left 0.05s, top 0.05s',
        zIndex: 999,
      }}
    />
  )
}
