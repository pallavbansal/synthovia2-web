"use client";
import { useEffect, useState } from "react";

const SurfingLoading = () => {
    const messages = [
        "AI is working to generate your ad copy...",
        "Tuning the message for maximum conversion...",
        "Analyzing target audience psychology...",
        "Crafting headline hooks and emotional angles...",
        "Just a moment, almost finished generating variants...",
        "Searching for the perfect CTA...",
        "Applying advanced copy optimization techniques...",
        "It's surfing... hang ten!",
    ];
    
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500); // Change message every 2.5 seconds

        return () => clearInterval(intervalId);
    }, []);

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

                {/* Surfing Spinner Animation */}
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

                {/* Message Below Animation */}
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
                    {messages[currentMessageIndex]}
                </p>

                {/* CSS Keyframes */}
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
