import '../tailwind.css'

import { HomeProviders } from './providers'
import { HomeRouter } from './router'

export default function HomeRemote() {
  return (
    <HomeProviders>
      <HomeRouter />
    </HomeProviders>
  )
}
