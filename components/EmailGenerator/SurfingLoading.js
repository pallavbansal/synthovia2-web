import React, { useEffect, useState } from 'react';

const SurfingLoading = ({ mode = 'generate' }) => {
    const generateMessages = [
        'Drafting your email...',
        'Writing a strong subject line...',
        'Refining tone and clarity...',
        'Polishing the call-to-action...',
        'Finalizing your email copy...',
    ];

    const historyMessages = [
        'Loading your email history...',
        'Fetching saved generations...',
        'Preparing your past variants...',
    ];

    const messages = mode === 'history' ? historyMessages : generateMessages;
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div style={styles.container}>
            <div style={styles.spinner} />
            <div style={styles.title}>{mode === 'history' ? 'Loading' : 'Generating'}</div>
            <div style={styles.subtitle}>{messages[messageIndex]}</div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const styles = {
    container: {
        padding: '28px 22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
    },
    spinner: {
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        border: '4px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px',
    },
    title: {
        fontSize: '16px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '6px',
    },
    subtitle: {
        fontSize: '14px',
        color: '#4b5563',
        maxWidth: '420px',
    },
};

export default SurfingLoading;
