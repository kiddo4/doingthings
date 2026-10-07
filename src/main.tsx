import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// It's a film — every visit starts at the opening titles
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
const toTop = () => { if (!location.hash) window.scrollTo(0, 0) }
toTop()
window.addEventListener('load', () => requestAnimationFrame(toTop), { once: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
