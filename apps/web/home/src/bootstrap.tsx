import { createRoot } from 'react-dom/client'

import { HomeStandalone } from './app/HomeStandalone'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element not found')
}

createRoot(container).render(<HomeStandalone />)
