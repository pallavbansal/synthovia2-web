import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { getAuthHeader } from "@/utils/auth";
import API from "@/utils/api";

export default function TestStreamPage() {
    const [status, setStatus] = useState('Idle');
    const [rawLog, setRawLog] = useState('');
    const [renderedText, setRenderedText] = useState('');
    const [error, setError] = useState('');
    const [timeElapsed, setTimeElapsed] = useState(0);
    const abortControllerRef = useRef(null);
    const timerRef = useRef(null);

    const testPayload1 = {
        "platform": { "type": "predefined", "id": 1, "value": "Meta (Facebook & Instagram)" },
        "placement": { "type": "predefined", "id": 8, "value": "Facebook Feed" },
        "campaign_objective": { "type": "predefined", "id": 36, "value": "Conversions/Sales" },
        "target_audience": [
            "Save 5+ hours per week on manual campaign tasks",
            "No-code builder for non-technical teams",
            "Works with existing CRM and ad platforms"
        ],
        "product_description": "Acme Automations is a no-code platform that connects your CRM, ad platforms, and helpdesk so you can build powerful automations without engineering support.",
        "key_benefits": [
            "Save 5+ hours per week on manual campaign tasks",
            "No-code builder for non-technical teams",
            "Works with existing CRM and ad platforms"
        ],
        "number_of_variants": 5,
        "tone_style": { "type": "predefined", "id": 45, "value": "Professional/Corporate" },
        "headline_focus": { "type": "predefined", "id": 64, "value": "Benefit-Focused" },
        "primary_text_length": { "type": "predefined", "id": 81, "value": "extended" },
        "cta_type": { "type": "predefined", "id": 90, "value": "Book a Demo" },
        "emotional_angle": { "type": "predefined", "id": 105, "value": "Relief / Stress-Free" },
        "compliance_notes": "Avoid hard promises on specific ROI percentages and do not mention competitors by name.",
        "brand_voice": "Friendly B2B SaaS tone that feels like a senior consultant giving clear advice.",
        "asset_reuse_strategy": { "type": "predefined", "id": 120, "value": "Retargeting (Warm)" },
        "offer_pricing_details": "14-day free trial, then plans from $49/month, cancel anytime.",
        "audience_pain_points": [
            "Too much time spent manually monitoring campaigns",
            "Hard to unify data from multiple ad platforms"
        ],
        "campaign_duration": { "start": "2025-12-01", "end": "2026-01-15" },
        "geographic_language_target": { "locale": "US", "language": "en" },
        "proof_elements": [
            "Trusted by 2,000+ teams",
            "Average customer saves 5+ hours per week"
        ],
        "session_request_id": crypto.randomUUID ? crypto.randomUUID() : `test-${Date.now()}`
    };
    const testPayload = {
        "platform": { "type": "predefined", "id": 1, "value": "Facebook" },
        "campaign_objective": { "type": "custom", "value": "Conversions" },
        "target_audience": ["Marketers"],
        "product_description": "No-code tool to automate ad ops.",
        "number_of_variants": 1
    }

    const stripSsePrefixes = (text) => text.replace(/^data:\s*/gm, '');

    // The robust JSON extractor that ignores newlines/buffering dependencies
    const extractNextJsonObject = (bufferObj) => {
        let buffer = bufferObj.text;
        let i = 0;
        while (i < buffer.length && /[\s,]/.test(buffer[i])) i++;
        if (i > 0) buffer = buffer.slice(i);
        if (!buffer) { bufferObj.text = ''; return null; }

        if (buffer[0] !== '{') {
            const nextObj = buffer.indexOf('{');
            if (nextObj === -1) {
                bufferObj.text = '';
                return null;
            }
            buffer = buffer.slice(nextObj);
        }

        let depth = 0;
        let inString = false;
        let escape = false;
        for (let idx = 0; idx < buffer.length; idx++) {
            const ch = buffer[idx];

            if (inString) {
                if (escape) { escape = false; } else if (ch === '\\') { escape = true; } else if (ch === '"') { inString = false; }
                continue;
            }

            if (ch === '"') { inString = true; continue; }
            if (ch === '{') { depth += 1; continue; }
            if (ch === '}') {
                depth -= 1;
                if (depth === 0) {
                    const jsonText = buffer.slice(0, idx + 1);
                    bufferObj.text = buffer.slice(idx + 1);
                    return jsonText;
                }
            }
        }
        bufferObj.text = buffer;
        return null;
    };

    const handleStartTest = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setRawLog('');
        setRenderedText('');
        setError('');
        setStatus('Connecting...');
        setTimeElapsed(0);

        abortControllerRef.current = new AbortController();
        const startTime = Date.now();

        timerRef.current = setInterval(() => {
            setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        const appendLog = (msg) => {
            setRawLog(prev => prev + `[${((Date.now() - startTime) / 1000).toFixed(2)}s] ${msg}\n`);
        };

        try {
            appendLog(`Fetching ${API.GENERATE_AD_COPY_CLAUDE_STREAM}...`);
            const response = await fetch(API.GENERATE_AD_COPY_CLAUDE_STREAM, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'Authorization': getAuthHeader(),
                },
                body: JSON.stringify(testPayload),
                signal: abortControllerRef.current.signal,
            });

            appendLog(`Response Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            setStatus('Streaming...');
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let bufferObj = { text: '' };

            const processMessage = (msg) => {
                if (msg.type === 'delta') {
                    setRenderedText(prev => prev + (msg.content || ''));
                    appendLog(`RECEIVED DELTA: ${JSON.stringify(msg)}`);
                } else {
                    appendLog(`Received chunk (Type: ${msg.type}) - Length: ${JSON.stringify(msg).length} chars`);
                }
            };

            const drainBuffer = () => {
                for (; ;) {
                    const jsonText = extractNextJsonObject(bufferObj);
                    if (!jsonText) break;
                    try {
                        const msg = JSON.parse(jsonText);
                        processMessage(msg);
                    } catch (e) {
                        bufferObj.text = `${jsonText}${bufferObj.text}`;
                        break;
                    }
                }
            };

            for (; ;) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunkStr = decoder.decode(value, { stream: true });
                appendLog(`--- RAW NETWORK READ: Received ${chunkStr.length} bytes ---`);

                bufferObj.text = stripSsePrefixes(bufferObj.text + chunkStr);
                drainBuffer();
            }
            drainBuffer();

            setStatus('Completed successfully');
            appendLog(`Stream ended.`);
        } catch (err) {
            if (err.name === 'AbortError') {
                setStatus('Aborted by user');
                appendLog('Request aborted.');
            } else {
                setStatus('Error');
                setError(err.message);
                appendLog(`ERROR: ${err.message}`);
            }
        } finally {
            clearInterval(timerRef.current);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            clearInterval(timerRef.current);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
            <Head>
                <title>Stream Test Dashboard</title>
            </Head>

            <h1 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>Stream Debugging Dashboard</h1>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <button
                    onClick={handleStartTest}
                    style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Start Stream Test
                </button>
                <button
                    onClick={handleStop}
                    style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Stop Test
                </button>
                <div style={{ fontWeight: 'bold', color: status === 'Error' ? 'red' : status === 'Completed successfully' ? 'green' : 'blue' }}>
                    Status: {status}
                </div>
                <div style={{ fontWeight: 'bold', color: '#6b7280' }}>
                    Time Elapsed: {timeElapsed}s
                </div>
            </div>

            {error && (
                <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3>Rendered Output (Visual Result)</h3>
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        minHeight: '400px',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {renderedText || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Output will appear here...</span>}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3>Diagnostic Logs (Raw Network & Chunks)</h3>
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        backgroundColor: '#1f2937',
                        color: '#10b981',
                        border: '1px solid #111827',
                        borderRadius: '6px',
                        minHeight: '400px',
                        maxHeight: '600px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {rawLog || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>Logs will appear here...</span>}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', color: '#92400e' }}>
                <h4>How to read the diagnostic log:</h4>
                <p>If you see multiple <strong>`--- RAW NETWORK READ ---`</strong> logs appearing incrementally over time, then the backend is streaming properly.</p>
                <p>If you see the timer tick for 15+ seconds, and then suddenly one massive <strong>`--- RAW NETWORK READ ---`</strong> appears with thousands of bytes at the very end, then the backend (LiteSpeed/Laravel) is buffering the response and needs the <code>X-LiteSpeed-Flush: on</code> header fix.</p>
            </div>
        </div>
    );
}
