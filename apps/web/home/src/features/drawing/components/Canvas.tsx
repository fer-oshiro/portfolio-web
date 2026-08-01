import { PointerEvent, useEffect, useRef, useState } from 'react'
import getStroke, { Vec2 } from 'perfect-freehand'
import { ReadyState } from 'react-use-websocket'

import { useRealtime, useRealtimeMessage } from '../../remote-control/realtime'

import './Canvas.css'

const COLORS = [
  { className: 'drawing-color--black', value: '#000000' },
  { className: 'drawing-color--red', value: '#ef4444' },
  { className: 'drawing-color--blue', value: '#3b82f6' },
  { className: 'drawing-color--green', value: '#22c55e' },
  { className: 'drawing-color--amber', value: '#f59e0b' },
]

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
  const { send, readyState } = useRealtime()

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
    send({ action: 'save_drawing', name: name.slice(0, 100) })
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

  useRealtimeMessage('upload_url', ({ url }) => uploadToS3(url))
  useRealtimeMessage('error', ({ source }) => {
    if (source === 'draw') setStatus('error')
  })

  return (
    <div>
      <div className="drawing-toolbar">
        {COLORS.map(({ className, value }) => (
          <button
            key={value}
            className={`drawing-color ${className}`}
            aria-pressed={color === value}
            onClick={() => setColor(value)}
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

      <div className="drawing-canvas-container">
        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          className="drawing-canvas"
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

      <div className="drawing-status">
        {status === 'okay' && <div>Obrigada ⸜(｡˃ ᵕ ˂ )⸝♡</div>}
        {status === 'idle' && (
          <>
            <input
              name="name"
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
            <button onClick={handleSubmit}>Salvar</button>
          </>
        )}
        {status === 'error' && <div>Vish... Erro no servidor (｡ᵕ ◞ _◟)</div>}
        {status === 'loading' && <div>Enviando ε(´｡•᎑•`)っ━ 📨</div>}
      </div>
    </div>
  )
}
