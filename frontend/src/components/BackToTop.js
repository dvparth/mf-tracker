import React from 'react';
import '../components/styles/header.css';

export default function BackToTop({ onClick }) {
    return (
        <button className="back-to-top" aria-label="Back to top" onClick={onClick}>
            ↑ Top
        </button>
    );
}
