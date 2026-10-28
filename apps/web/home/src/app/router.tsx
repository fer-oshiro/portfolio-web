import { Route, Routes } from 'react-router'

import { Draw } from '../features/drawing'
import { Mobile } from '../features/remote-control'
import { ComputerPage } from '../features/room'
import { Home } from '../pages/Home'

export function HomeRouter() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="mobile" element={<Mobile />} />
      <Route path="chat" element={<ComputerPage />} />
      <Route path="draw" element={<Draw show />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  )
}
