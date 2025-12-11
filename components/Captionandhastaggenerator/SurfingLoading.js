"use client";
import { useEffect, useState } from "react";

// Define different message sets for different modes (Caption & Hashtag context)
const GENERATION_MESSAGES = [
    "AI is crafting your captions and hashtags...",
    "Tuning tone and style for your post...",
    "Analyzing your target audience for better engagement...",
    "Balancing caption length and readability...",
    "Just a moment, almost finished generating caption variants...",
    "Optimizing hashtag mix for reach and relevance...",
    "Applying advanced language optimization for your post...",
    "It's surfing through ideas... hang tight!",
];

const HISTORY_MESSAGES = [
    "Loading your previous caption & hashtag variants log...",
    "Retrieving your saved post inputs and settings...",
    "Compiling generated captions and hashtags for display...",
    "Finalizing history view for your content...",
    "Almost done, loading caption log data...",
    "Organizing your historical caption & hashtag variants...",
    "History log retrieval in progress...",
    "Log loaded successfully!",
];

/**
 * @param {object} props
 * @param {'generate' | 'history'} [props.mode='generate'] - Determines the messages to display.
 */
const SurfingLoading = ({ mode = 'generate' }) => {
    
    // Determine the active message set based on the mode prop
    const activeMessages = mode === 'history' ? HISTORY_MESSAGES : GENERATION_MESSAGES;

    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    // Reset index whenever the mode changes
    useEffect(() => {
        setCurrentMessageIndex(0);
    }, [mode]);

    useEffect(() => {
        // Use the length of the active message set
        const messagesLength = activeMessages.length;

        const intervalId = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messagesLength);
        }, 2500); // Change message every 2.5 seconds

        return () => clearInterval(intervalId);
    }, [activeMessages]); // Restart interval if message set changes

    return (
        <div style={{ 
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
            padding: '20px'
        }}>
            <div style={{
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
            }}>

                {/* Surfing Spinner Animation (Retained) */}
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

                {/* Message Below Animation (Uses activeMessages) */}
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

                {/* CSS Keyframes (Retained) */}
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes blink {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0; }
                        }
                    `,
                    }}
                />
            </div>
        </div>
    );
};

export default SurfingLoading;