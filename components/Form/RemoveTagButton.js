import React from 'react';

const RemoveTagButton = ({ onClick, style }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            style={style}
        >
            <span style={{ transform: 'translateY(-1px)' }}>×</span>
        </button>
    );
};

export default RemoveTagButton;
