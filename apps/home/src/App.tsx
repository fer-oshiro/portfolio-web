import { createRoot } from 'react-dom/client'

import './index.css'

const App = () => (
  <div className="container">
    <div>Name: home</div>
    <div>Framework: react</div>
    <div>Language: TypeScript</div>
    <div>CSS: Empty CSS</div>
  </div>
)

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)
