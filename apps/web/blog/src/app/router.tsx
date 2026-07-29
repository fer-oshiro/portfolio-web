import { Route, Routes } from 'react-router'

import { MainPage } from '../pages'
import { FirstPost } from '../pages/3d-progress'

export function BlogRouter() {
  return (
    <Routes>
      <Route index element={<MainPage />} />
      <Route path="first-post" element={<FirstPost />} />
    </Routes>
  )
}
