import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { RemoteBoundary } from './remote-boundary'

const Blog = lazy(() => import('blog/Blog'))
const Home = lazy(() => import('home/Home'))
const Resume = lazy(() => import('resume/Resume'))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/resume"
          element={
            <RemoteBoundary key="resume" name="Resume">
              <Resume />
            </RemoteBoundary>
          }
        />
        <Route
          path="/blog/*"
          element={
            <RemoteBoundary key="blog" name="Blog">
              <Blog />
            </RemoteBoundary>
          }
        />
        <Route
          path="/*"
          element={
            <RemoteBoundary key="home" name="Home">
              <Home />
            </RemoteBoundary>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
