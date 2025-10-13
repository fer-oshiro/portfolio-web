import { BrowserRouter, Route, Routes } from 'react-router'

import Blog from 'blog/Blog'
import Home from 'home/Home'
import Resume from 'resume/Resume'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/blog/*" element={<Blog />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}
