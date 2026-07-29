import { Route, Routes } from 'react-router'

import { Chat } from '../pages/Chat'
import Draw from '../pages/Home/Draw'
import { Home } from '../pages/Home'
import { Mobile } from '../pages/Mobile'

export function HomeRouter() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="mobile" element={<Mobile />} />
      <Route path="chat" element={<Chat />} />
      <Route path="draw" element={<Draw show />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  )
}
