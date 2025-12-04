// CustomCheckbox.js - Create this as a new component
import React from 'react';

const CustomCheckbox = ({ checked, onChange, label, value }) => {
    const handleClick = () => {
        onChange({ target: { name: 'formattingOptions', value, checked: !checked } });
    };

    return (
        <label 
            onClick={handleClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
                userSelect: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            {/* Custom Checkbox Visual */}
            <div
                style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: `2px solid ${checked ? '#3b82f6' : '#64748b'}`,
                    backgroundColor: checked ? '#3b82f6' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                }}
            >
                {/* Checkmark SVG */}
                {checked && (
                    <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 14 14" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            d="M11.6666 3.5L5.24992 9.91667L2.33325 7" 
                            stroke="white" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>
            
            {/* Label Text */}
            <span style={{
                fontSize: '14px',
                color: '#e2e8f0',
                fontWeight: '400'
            }}>
                {label}
            </span>
            
            {/* Hidden native checkbox for accessibility */}
            <input
                type="checkbox"
                checked={checked}
                onChange={() => {}}
                style={{ display: 'none' }}
                aria-label={label}
            />
        </label>
    );
};

export default CustomCheckbox;