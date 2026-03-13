import { QRCodeSVG } from 'qrcode.react'
import './QRCode.css'

export const QRCode = ({ roomId }: { roomId: string }) => {
  console.log(`${process.env.WEBPACK_URL}/mobile?roomId=${roomId}`)
  return (
    <div className="QRCode">
      <QRCodeSVG
        value={`${process.env.WEBPACK_URL}/mobile?roomId=${roomId}`}
        size={128}
      />
    </div>
  )
}
