import React from 'react';

const ToggleButton = ({ showAdvanced, onToggle }) => {
    return (
        <div className="col-12" style={{ margin: '16px 0' }}>
            <div style={{
                display: 'inline-flex',
                backgroundColor: 'white',
                borderRadius: '9999px',
                border: '1px solid #3b82f6',
                overflow: 'hidden',
                width: 'fit-content',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
                <button
                    type="button"
                    onClick={onToggle}
                    style={{
                        padding: '6px 20px',
                        border: 'none',
                        backgroundColor: showAdvanced ? 'transparent' : '#3b82f6',
                        color: showAdvanced ? '#1f2937' : 'white',
                        fontWeight: 500,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: '9999px',
                        margin: '2px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <span>Hide Advanced</span>
                </button>
                <button
                    type="button"
                    onClick={onToggle}
                    style={{
                        padding: '6px 20px',
                        border: 'none',
                        backgroundColor: showAdvanced ? '#3b82f6' : 'transparent',
                        color: showAdvanced ? 'white' : '#1f2937',
                        fontWeight: 500,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderRadius: '9999px',
                        margin: '2px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <span>Show Advanced</span>
                </button>
            </div>
        </div>
    );
};

export default ToggleButton;
