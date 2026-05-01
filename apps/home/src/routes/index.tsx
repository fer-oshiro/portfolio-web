import { AnimatePresence } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router'

import { Layout } from '../components/Layout'
import { Desktop } from '../pages/Desktop'
import Draw from '../pages/Draw'
import Home from '../pages/Home'
import { Mobile } from '../pages/Mobile'
import { Cat } from '../pages/Cat'

export function HomeRoute() {
  const location = useLocation()
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="mobile" element={<Mobile />} />
            <Route path="desktop" element={<Desktop />} />
            <Route path="draw" element={<Draw />} />
            <Route path="cat" element={<Cat />} />
            <Route path="*" element={<div>404</div>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  )
}
