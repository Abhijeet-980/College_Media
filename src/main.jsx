import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MessagingProvider } from './contexts/MessagingContext'

/**
 * Initialize and render the React application
 * 
 * - Finds the root DOM element (id="root" in index.html)
 * - Creates a React root to enable concurrent features
 * - Wraps App with StrictMode for development warnings
 * - StrictMode catches common React errors during development
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
