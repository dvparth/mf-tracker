import React from 'react';
import ReactDOM from 'react-dom/client';
// Redux removed: Provider/store no longer used
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Expose RapidAPI runtime keys on window for the hybrid adapter to detect at runtime.
// This makes it easy to test locally via URL param, localStorage or build-time env.
try {
    if (typeof window !== 'undefined') {
        // prefer existing window value (manual injection), else use build-time env
        window.__RAPIDAPI_KEY__ = window.__RAPIDAPI_KEY__ || (process && process.env && process.env.REACT_APP_RAPIDAPI_KEY) || '';
        window.__RAPIDAPI_HOST__ = window.__RAPIDAPI_HOST__ || (process && process.env && process.env.REACT_APP_RAPIDAPI_HOST) || 'latest-mutual-fund-nav.p.rapidapi.com';
        // window runtime keys initialized (if present)
    }
} catch (e) {
    // ignore errors in unusual environments
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
