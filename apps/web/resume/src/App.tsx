import { createRoot } from 'react-dom/client'

import './index.css'
import Resume from './Resume'

const App = () => (
  <div className="container">
    <Resume />
  </div>
)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
