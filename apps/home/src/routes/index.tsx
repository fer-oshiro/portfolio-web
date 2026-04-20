import { AnimatePresence } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router'
import { Transition } from '../components/transition'
import { Desktop } from '../pages/Desktop'
import Draw from '../pages/Draw'
import Home from '../pages/Home'
import { Mobile } from '../pages/Mobile'

export function HomeRoute() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route index element={<Home />} />
        <Route path="mobile" element={<Mobile />} />
        <Route path="desktop" element={<Desktop />} />
        <Route path="/draw" element={<Draw />} />
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </AnimatePresence>
  )
}
