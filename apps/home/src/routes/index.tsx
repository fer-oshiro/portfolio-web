import { Route, Routes } from 'react-router'
import Home from '../pages/Home'
import Mobile from '../pages/Mobile'

export function HomeRoute() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="mobile" element={<Mobile />} />
      <Route path="*" element={<div>404</div>} />
    </Routes>
  )
}
