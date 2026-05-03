import { AnimatePresence } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router'

import { Layout } from '../components/Layout'
import { WebSocket } from '../components/WebSocket'
import { Desktop } from '../pages/Desktop'
import { Home } from '../pages/Home'
import { Mobile } from '../pages/Mobile'

export function HomeRoute() {
  const location = useLocation()
  return (
    <>
      <WebSocket />
      <Routes>
        <Route index element={<Home />} />
        <Route path="desktop" element={<Desktop />} />
        <Route path="*" element={<div>404</div>} />
        <Route path="mobile" element={<Mobile />} />
      </Routes>
    </>
  )
}
