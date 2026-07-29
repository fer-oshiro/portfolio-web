import { createRoot } from 'react-dom/client'

import './index.css'
import Home from './Home'
import { BrowserRouter } from 'react-router'

const App = () => (
  <div className="container">
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  </div>
)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
