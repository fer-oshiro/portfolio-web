import { createRoot } from 'react-dom/client'

import { BlogStandalone } from './app/BlogStandalone'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element not found')
}

createRoot(container).render(<BlogStandalone />)
