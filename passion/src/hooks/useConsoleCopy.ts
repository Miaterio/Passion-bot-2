import { useState, useEffect, useCallback } from 'react';

interface LogEntry {
    timestamp: string;
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
}

export function useConsoleCopy() {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Store original console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        // Helper to format arguments
        const formatArgs = (...args: any[]): string => {
            return args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');
        };

        // Override console methods
        console.log = (...args: any[]) => {
            const message = formatArgs(...args);
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                type: 'log',
                message
            }]);
            originalLog(...args);
        };

        console.error = (...args: any[]) => {
            const message = formatArgs(...args);
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                type: 'error',
                message
            }]);
            originalError(...args);
        };

        console.warn = (...args: any[]) => {
            const message = formatArgs(...args);
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                type: 'warn',
                message
            }]);
            originalWarn(...args);
        };

        console.info = (...args: any[]) => {
            const message = formatArgs(...args);
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                type: 'info',
                message
            }]);
            originalInfo(...args);
        };

        // Cleanup
        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
        };
    }, []);

    const copyLogs = useCallback(async () => {
        const formattedLogs = logs.map(log =>
            `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
        ).join('\n');

        try {
            // Try Telegram WebApp clipboard first (more reliable on iOS in Telegram)
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.clipboard) {
                await (window as any).Telegram.WebApp.clipboard.writeText(formattedLogs);
                console.log('✅ Logs copied via Telegram clipboard');
                return true;
            }

            // Fallback to standard clipboard API
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(formattedLogs);
                console.log('✅ Logs copied via Navigator clipboard');
                return true;
            }

            // Last resort: create textarea and copy
            const textarea = document.createElement('textarea');
            textarea.value = formattedLogs;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);

            if (success) {
                console.log('✅ Logs copied via execCommand');
                return true;
            }

            console.error('❌ Failed to copy logs');
            return false;
        } catch (error) {
            console.error('❌ Error copying logs:', error);
            return false;
        }
    }, [logs]);

    const clearLogs = useCallback(() => {
        setLogs([]);
        console.log('🗑️ Logs cleared');
    }, []);

    return {
        logs,
        copyLogs,
        clearLogs,
        logsCount: logs.length
    };
}
