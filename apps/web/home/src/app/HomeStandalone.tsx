import { BrowserRouter } from 'react-router'

import '../index.css'
import HomeRemote from './HomeRemote'

export function HomeStandalone() {
  return (
    <div className="container">
      <BrowserRouter>
        <HomeRemote />
      </BrowserRouter>
    </div>
  )
}
