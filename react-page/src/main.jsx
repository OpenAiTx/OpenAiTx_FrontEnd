import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter 
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <App />
    </HashRouter>
  </React.StrictMode>,
) 