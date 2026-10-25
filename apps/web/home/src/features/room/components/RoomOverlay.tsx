import { Tricked } from '../../../components/Tricked'

type RoomOverlayProps = {
  videoOpen: boolean
  onVideoClose: () => void
}

export function RoomOverlay({ videoOpen, onVideoClose }: RoomOverlayProps) {
  return <Tricked open={videoOpen} onClose={onVideoClose} />
}
