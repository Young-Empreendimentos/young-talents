import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './ThemeContext'
import CelebracaoVenda from './components/CelebracaoVenda'
import { supabase } from './supabase'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <CelebracaoVenda supabase={supabase} sistema="Talents" somUrl="/sons/venda-celebracao.mp3" />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
