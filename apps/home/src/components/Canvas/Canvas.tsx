import { PointerEvent, useEffect, useRef, useState } from 'react'
import getStroke, { Vec2 } from 'perfect-freehand'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { WS_URL } from '../../service/constants'

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b']

type Points = {
  points: [number, number][]
  color: string
  brushSize: number
}

function getSvgPathFromStroke(stroke: Vec2[]) {
  if (!stroke.length || !stroke[0]) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]!
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'],
  )
  d.push('Z')
  return d.join(' ')
}

export function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [lines, setLines] = useState<Points[]>([])
  const [currentPoints, setCurrentPoints] = useState<Points | null>(null)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(6)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'okay' | 'error'>(
    'idle',
  )
  const [size, setSize] = useState({
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.5,
  })
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket<{
    type: string
    from: string
    text: string
    data: any
  }>(WS_URL, { share: true })

  const handlePointerDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    setCurrentPoints({
      points: [[e.clientX - rect.left, e.clientY - rect.top]],
      color,
      brushSize,
    })
  }

  const handlePointerMove = (e: PointerEvent<SVGSVGElement>) => {
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
    setStatus('loading')
    sendJsonMessage({ action: 'save_drawing', message: name })
  }

  const exportSVG = () => {
    const svg = svgRef.current
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    return svgStr
  }

  const uploadToS3 = async (presignedUrl: string) => {
    try {
      const svgStr = exportSVG()
      if (!svgStr || !presignedUrl) return

      const blob = new Blob([svgStr], { type: 'image/svg+xml' })

      await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      })
      setStatus('okay')
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  const handleUndo = () => {
    setLines((prev) => prev.slice(0, -1))
  }

  useEffect(() => {
    const updateSize = () => {
      const size = window.innerWidth * 0.8 > 600 ? 600 : window.innerWidth * 0.8
      setSize({
        width: size,
        height: size,
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

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
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: 12,
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
        <button onClick={handleUndo}>Undo</button>
        <button onClick={() => setLines([])}>Limpar</button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          style={{
            border: '1px solid #ccc',
            cursor: 'crosshair',
            touchAction: 'none',
            backgroundColor: 'white',
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

      <div style={{ paddingTop: 24 }}>
        {status === 'okay' && <div>Obrigada ⸜(｡˃ ᵕ ˂ )⸝♡</div>}
        {status === 'idle' && (
          <>
            <input name="name" onChange={(e) => setName(e.target.value)} />
            <button onClick={handleSubmit}>Salvar</button>
          </>
        )}
        {status === 'error' && <div>Vish... Erro no servidor (｡ᵕ ◞ _◟)</div>}
        {status === 'loading' && <div>Enviando ε(´｡•᎑•`)っ━ 📨</div>}
      </div>
    </div>
  )
}
