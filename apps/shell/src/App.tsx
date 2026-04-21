import { createRoot } from 'react-dom/client'

import './index.css'
import { AppRoutes } from './router/index.router'

const App = () => (
  <div className="container">
    <AppRoutes />
  </div>
)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
