import { useEffect, useRef, useState } from 'react'
import getStroke from 'perfect-freehand'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { WS_URL } from '../../service/constants'

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b']

type Points = {
  points: [number, number][]
  color: string
  brushSize: number
}

function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'],
  )
  d.push('Z')
  return d.join(' ')
}

export function Canvas() {
  const svgRef = useRef<SVGElement>(null)
  const [lines, setLines] = useState<Points[]>([])
  const [currentPoints, setCurrentPoints] = useState<Points | null>(null)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(6)
  const [name, setName] = useState('')
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    { share: true },
  )

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    setCurrentPoints({
      points: [[e.clientX - rect.left, e.clientY - rect.top]],
      color,
      brushSize,
    })
  }

  const handlePointerMove = (e) => {
    if (!currentPoints) return
    const rect = e.currentTarget.getBoundingClientRect()
    setCurrentPoints((prev) => ({
      color: 'black',
      brushSize: 5,
      ...prev,
      points: [
        ...(prev?.points ?? []),
        [e.clientX - rect.left, e.clientY - rect.top],
      ],
    }))
  }
  const handlePointerUp = () => {
    if (!currentPoints) return
    setLines((prev) => [...prev, currentPoints])
    setCurrentPoints(null)
  }

  const allLines = currentPoints ? [...lines, currentPoints] : lines

  const handleSubmit = () => {
    if (readyState !== ReadyState.OPEN) return
    sendJsonMessage({ action: 'save_drawing', message: name })
  }

  const exportSVG = () => {
    const svg = svgRef.current
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    return svgStr
  }

  const uploadToS3 = async (presignedUrl) => {
    const svgStr = exportSVG()
    if (!svgStr && !presignedUrl) return

    const blob = new Blob([svgStr], { type: 'image/svg+xml' })

    await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    })
  }

  useEffect(() => {
    if (
      lastJsonMessage?.from === 'url_draw' &&
      lastJsonMessage?.type === 'done'
    ) {
      uploadToS3(lastJsonMessage?.text)
    }
  }, [lastJsonMessage])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 8,
          alignItems: 'center',
        }}
      >
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: c,
              border: color === c ? '3px solid #000' : '2px solid #ccc',
              cursor: 'pointer',
            }}
          />
        ))}
        <input
          type="range"
          min={2}
          max={30}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
        <button onClick={() => setLines([])}>Limpar</button>
        <input name="name" onChange={(e) => setName(e.target.value)} />
        <button onClick={handleSubmit}>Salvar</button>
      </div>

      <svg
        ref={svgRef}
        width={500}
        height={800}
        style={{
          border: '1px solid #ccc',
          cursor: 'crosshair',
          touchAction: 'none',
          backgroundColor: 'white',
          width: '500px',
          padding: '16px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {allLines.map((line, i) => (
          <path
            key={i}
            d={getSvgPathFromStroke(
              getStroke(line.points, {
                size: line.brushSize,
                thinning: 0,
                smoothing: 0.7,
                streamline: 0.6,
              }),
            )}
            fill={line.color}
          />
        ))}
      </svg>
    </div>
  )
}
