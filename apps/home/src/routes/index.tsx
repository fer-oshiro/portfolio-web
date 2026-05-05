import { Route, Routes } from 'react-router'

import { Desktop } from '../pages/Desktop'
import { Home } from '../pages/Home'
import { Mobile } from '../pages/Mobile'
import { Chat } from '../pages/Chat'

export function HomeRoute() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="desktop" element={<Desktop />} />
      <Route path="mobile" element={<Mobile />} />
      <Route path="chat" element={<Chat />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  )
}
