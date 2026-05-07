import React from 'react';

export default function BackToTop({ onClick }) {
    return (
        <button className="back-to-top" aria-label="Back to top" onClick={onClick}>
            ↑ Top
        </button>
    );
}
