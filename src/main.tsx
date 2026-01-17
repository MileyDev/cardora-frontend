import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { registerServiceWorker } from './pwa/registerServiceWorker.ts'
import theme from './theme.ts'
import './index.css'
import App from './App.tsx'
import Header from './components/Header.tsx'

createRoot(document.getElementById('root')!).render(
  <ChakraProvider theme={theme}>
    <BrowserRouter>
      <StrictMode>
        <Header />
        <App />
      </StrictMode>
    </BrowserRouter>
  </ChakraProvider>,
)

registerServiceWorker();
