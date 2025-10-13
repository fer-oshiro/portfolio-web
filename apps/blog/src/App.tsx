import { createRoot } from 'react-dom/client'

import Blog from './Blog'
import './index.css'

const App = () => (
  <div className="container">
    <Blog />
  </div>
)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
