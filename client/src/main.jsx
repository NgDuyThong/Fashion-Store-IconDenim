import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId='976672513227-aol6tnoi015h0g61h6gpj6gtflshm3uv.apps.googleusercontent.com'>
      <App />
  </GoogleOAuthProvider>
)

//! StrictMode Cũ
// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )