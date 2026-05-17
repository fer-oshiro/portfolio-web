import { createRoot } from 'react-dom/client'

import { AppRoutes } from './router/index.router'

import './index.css'

const App = () => (
  <div className="container">
    <AppRoutes />
  </div>
)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
