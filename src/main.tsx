import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

export const isSaasBuild = import.meta.env.REACT_IS_SAAS_BUILD?.toLocaleLowerCase() === 'true';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
