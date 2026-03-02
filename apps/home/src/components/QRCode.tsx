import './QRCode.css'
import { QRCodeSVG } from 'qrcode.react'

export const QRCode = () => {
  return (
    <div className="QRCode">
      <QRCodeSVG value="http://192.168.0.29:3000/mobile" size={128} />
    </div>
  )
}
