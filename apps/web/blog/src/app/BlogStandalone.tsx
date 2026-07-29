import { BrowserRouter } from 'react-router'

import BlogRemote from './BlogRemote'

export function BlogStandalone() {
  return (
    <BrowserRouter>
      <BlogRemote />
    </BrowserRouter>
  )
}
