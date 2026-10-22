import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TaskManagerApp from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TaskManagerApp />
  </StrictMode>,
)
