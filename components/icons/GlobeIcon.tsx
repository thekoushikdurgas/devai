import React from 'react';

export const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.5h8.586a2 2 0 011.766 1.032l3.126 6.253a2 2 0 010 1.936l-3.126 6.253a2 2 0 01-1.766 1.032H7.707a2 2 0 01-1.766-1.032L2.815 13.72a2 2 0 010-1.936l3.126-6.253A2 2 0 017.707 4.5z" />
    </svg>
);