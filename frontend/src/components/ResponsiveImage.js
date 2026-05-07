import React from 'react';

// Usage:
// <ResponsiveImage baseName="hero" alt="Hero" sizes={[{w:1200, file:'hero-1200.webp'},{w:600,file:'hero-600.webp'}]} fallback="hero-1200.jpg" lazy/>

export default function ResponsiveImage({ baseName, alt, sizes = [], fallback = '', className = '', loading = 'lazy', ...rest }) {
    // sizes is an array of {w, file} entries for srcset
    const srcSet = sizes.map(s => `${s.file} ${s.w}w`).join(', ');
    const src = fallback || (sizes.length > 0 ? sizes[0].file : '');
    if (!alt) {
        // Enforce alt presence for accessibility. If intentionally decorative, pass alt="" explicitly.
        // eslint-disable-next-line no-console
        console.warn('ResponsiveImage: missing alt text for', baseName || src);
    }
    return (
        <img src={src} srcSet={srcSet} sizes="(max-width: 600px) 100vw, 50vw" alt={alt || ''} loading={loading} className={className} {...rest} />
    );
}
