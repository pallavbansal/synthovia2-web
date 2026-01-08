"use client";
import { useEffect, useState } from "react";

const GENERATION_MESSAGES = [
    "AI is drafting your script...",
    "Structuring hook, body, and CTA...",
    "Adapting tone and pacing for your platform...",
    "Balancing length with clarity and engagement...",
    "Finalizing the script details...",
    "It's surfing through ideas... hang tight!",
];

const HISTORY_MESSAGES = [
    "Loading your previous scripts...",
    "Retrieving saved inputs and settings...",
    "Compiling generated scripts for display...",
    "Finalizing history view...",
    "Almost done, loading log data...",
];

/**
 * @param {object} props
 * @param {'generate' | 'history'} [props.mode='generate']
 */
const SurfingLoading = ({ mode = 'generate' }) => {
    const activeMessages = mode === 'history' ? HISTORY_MESSAGES : GENERATION_MESSAGES;
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        setCurrentMessageIndex(0);
    }, [mode]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % activeMessages.length);
        }, 2500);

        return () => clearInterval(intervalId);
    }, [activeMessages]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '300px',
                    width: '400px',
                    padding: '40px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                }}
            >
                <div
                    className="surf-loader"
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        border: "6px solid #bfdbfe",
                        borderTopColor: "#3b82f6",
                        animation: "spin 1.5s linear infinite",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "30px",
                            height: "30px",
                            backgroundColor: "#3b82f6",
                            borderRadius: "50%",
                            boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                        }}
                    />
                </div>

                <p
                    style={{
                        marginTop: "20px",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1e293b",
                        textAlign: "center",
                        minHeight: "40px",
                    }}
                >
                    {activeMessages[currentMessageIndex]}
                </p>

                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `,
                    }}
                />
            </div>
        </div>
    );
};

export default SurfingLoading;
