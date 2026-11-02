import React from 'react';
import ReactDOM from 'react-dom/client';
import '@tokens/themes.css';
import './index.css';
import { App } from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('No se encontró el elemento raíz #root en el documento');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
