import { Route, Routes } from 'react-router'
import Home from '../pages/Home'
import { Mobile } from '../pages/Mobile'
import { Desktop } from '../pages/Desktop'

export function HomeRoute() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="mobile" element={<Mobile />} />
      <Route path="desktop" element={<Desktop />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  )
}
