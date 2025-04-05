import { createRoot } from 'react-dom/client'

import './index.css'
import Home from 'home/Home'
import Resume from 'resume/Resume'

const App = () => (
  <div className="container">
    <Home />
    <Resume />
  </div>
)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
