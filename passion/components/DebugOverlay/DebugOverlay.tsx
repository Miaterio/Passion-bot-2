'use client';

import { useState, useEffect } from 'react';

interface DebugLog {
    timestamp: string;
    message: string;
    data?: any;
}

interface DebugOverlayProps {
    maxLogs?: number;
}

let logSubscribers: ((log: DebugLog) => void)[] = [];

export function addDebugLog(message: string, data?: any) {
    const log: DebugLog = {
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour12: false, fractionalSecondDigits: 3 }),
        message,
        data
    };
    logSubscribers.forEach(subscriber => subscriber(log));
}

export function DebugOverlay({ maxLogs = 50 }: DebugOverlayProps) {
    const [logs, setLogs] = useState<DebugLog[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const handleLog = (log: DebugLog) => {
            setLogs(prev => [...prev.slice(-(maxLogs - 1)), log]);
        };

        logSubscribers.push(handleLog);

        return () => {
            logSubscribers = logSubscribers.filter(s => s !== handleLog);
        };
    }, [maxLogs]);

    const copyToClipboard = async () => {
        const text = logs.map(log => {
            const dataStr = log.data ? `\n${JSON.stringify(log.data, null, 2)}` : '';
            return `[${log.timestamp}] ${log.message}${dataStr}`;
        }).join('\n\n');

        try {
            await navigator.clipboard.writeText(text);
            addDebugLog('✅ Логи скопированы в буфер');
        } catch (err) {
            addDebugLog('❌ Ошибка копирования', { error: String(err) });
        }
    };

    const clearLogs = () => {
        setLogs([]);
        addDebugLog('🗑️ Логи очищены');
    };

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#0f0',
                    border: '1px solid #0f0',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    zIndex: 99999,
                }}
            >
                🐛
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                width: isMinimized ? '200px' : 'calc(100vw - 20px)',
                maxWidth: isMinimized ? '200px' : '600px',
                maxHeight: isMinimized ? '50px' : '400px',
                background: 'rgba(0, 0, 0, 0.95)',
                border: '1px solid #0f0',
                borderRadius: '8px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '8px 12px',
                    background: 'rgba(0, 255, 0, 0.1)',
                    borderBottom: '1px solid #0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <div style={{ color: '#0f0', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    🐛 Debug ({logs.length})
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'transparent',
                            color: '#0f0',
                            border: '1px solid #0f0',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            cursor: 'pointer',
                        }}
                    >
                        {isMinimized ? '▼' : '▲'}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            background: 'transparent',
                            color: '#0f0',
                            border: '1px solid #0f0',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            cursor: 'pointer',
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <>
                    {/* Logs */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '8px',
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            lineHeight: '1.4',
                            color: '#0f0',
                        }}
                    >
                        {logs.length === 0 ? (
                            <div style={{ opacity: 0.5 }}>Логи отсутствуют...</div>
                        ) : (
                            logs.map((log, index) => (
                                <div
                                    key={index}
                                    style={{
                                        marginBottom: '8px',
                                        paddingBottom: '8px',
                                        borderBottom: '1px solid rgba(0, 255, 0, 0.2)',
                                    }}
                                >
                                    <div style={{ color: '#888' }}>[{log.timestamp}]</div>
                                    <div>{log.message}</div>
                                    {log.data && (
                                        <pre
                                            style={{
                                                margin: '4px 0 0 0',
                                                padding: '4px',
                                                background: 'rgba(0, 255, 0, 0.05)',
                                                borderRadius: '4px',
                                                fontSize: '9px',
                                                overflow: 'auto',
                                            }}
                                        >
                                            {JSON.stringify(log.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions */}
                    <div
                        style={{
                            padding: '8px',
                            borderTop: '1px solid #0f0',
                            display: 'flex',
                            gap: '8px',
                        }}
                    >
                        <button
                            onClick={copyToClipboard}
                            disabled={logs.length === 0}
                            style={{
                                flex: 1,
                                background: logs.length === 0 ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 255, 0, 0.2)',
                                color: logs.length === 0 ? '#555' : '#0f0',
                                border: '1px solid #0f0',
                                borderRadius: '4px',
                                padding: '8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
                                fontFamily: 'monospace',
                            }}
                        >
                            📋 Копировать
                        </button>
                        <button
                            onClick={clearLogs}
                            disabled={logs.length === 0}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                color: logs.length === 0 ? '#555' : '#f00',
                                border: '1px solid',
                                borderColor: logs.length === 0 ? '#555' : '#f00',
                                borderRadius: '4px',
                                padding: '8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
                                fontFamily: 'monospace',
                            }}
                        >
                            🗑️ Очистить
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
