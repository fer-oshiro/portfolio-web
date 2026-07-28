import './tailwind.css'

import { HomeRoute } from './routes'
import { RealtimeProvider } from './service/RealtimeProvider'

export default function Home() {
  return (
    <RealtimeProvider>
      <HomeRoute />
    </RealtimeProvider>
  )
}
