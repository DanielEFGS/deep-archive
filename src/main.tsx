import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { applyTheme, resolveInitialTheme } from './hooks/useTheme';

const initialTheme = resolveInitialTheme();
applyTheme(initialTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App initialTheme={initialTheme} />
  </React.StrictMode>,
);
