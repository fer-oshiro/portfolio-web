import { QRCodeSVG } from 'qrcode.react'
import './RoomQRCode.css'

export const QRCode = ({ roomId }: { roomId: string }) => {
  console.log(
    `${window.location.protocol}//${window.location.host}/mobile?roomId=${roomId}`,
  )
  return (
    <div className="QRCode">
      <QRCodeSVG
        value={`${window.location.protocol}//${window.location.host}/mobile?roomId=${roomId}`}
        size={128}
      />
    </div>
  )
}
