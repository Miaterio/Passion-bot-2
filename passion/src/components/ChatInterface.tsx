import { useState, useRef, useEffect } from 'react';
import { BounceEffect } from '../../components/BounceEffect/BounceEffect';
import { Avatar } from '../lib/bot/prompts';
import { useHaptic } from '../hooks/useHaptic';
import { useConsoleCopy } from '../hooks/useConsoleCopy';
import { useKeyboardDiagnostics } from '../hooks/useKeyboardDiagnostics';
import { useKeyboardState } from '../hooks/useKeyboardState';
import { useVisualViewportFix } from '../hooks/useVisualViewportFix';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    avatar: Avatar;
    onBack: () => void;
    initData: string;
    isExiting?: boolean;
    onExitComplete?: () => void;
    onKeyboardChange?: (isOpen: boolean) => void;
    onInputFocusChange?: (isFocused: boolean) => void;
}

export function ChatInterface({ avatar, onBack, initData, isExiting, onExitComplete, onKeyboardChange, onInputFocusChange }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const initialViewportHeightRef = useRef<number>(0);
    const { selection, notification } = useHaptic();

    // Capture initial viewport height on mount (before any keyboard events)
    useEffect(() => {
        if (typeof window !== 'undefined' && initialViewportHeightRef.current === 0) {
            initialViewportHeightRef.current = window.innerHeight;
            console.log('🔒 ChatInterface captured initial viewport height:', initialViewportHeightRef.current);
        }
    }, []);

    // Track keyboard state to disable transitions during keyboard events
    const isKeyboardOpen = useKeyboardState({ inputRef });

    // Fix iOS visual viewport offset (counter iOS slide animation)
    useVisualViewportFix();

    // Notify parent about keyboard state changes
    useEffect(() => {
        onKeyboardChange?.(isKeyboardOpen);
    }, [isKeyboardOpen, onKeyboardChange]);

    // Enhanced diagnostics and console copy
    useKeyboardDiagnostics();
    const { copyLogs, clearLogs, logsCount } = useConsoleCopy();
    const isDev = process.env.NODE_ENV === 'development';

    // Handle exit animation
    useEffect(() => {
        if (isExiting) {
            const timer = setTimeout(() => {
                onExitComplete?.();
            }, 600); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isExiting, onExitComplete]);

    // Mount animation
    useEffect(() => {
        const mountTimer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(mountTimer);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Aggressive scroll reset when keyboard is open
    useEffect(() => {
        if (!isKeyboardOpen) return;

        const resetScroll = () => {
            if (window.scrollY !== 0 || window.scrollX !== 0) {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            }
            // Also reset on document level
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        };

        // Prevent scroll events entirely
        const preventScroll = (e: Event) => {
            // Only prevent window-level scroll, not scroll inside containers
            if (e.target === document || e.target === document.body || e.target === document.documentElement) {
                e.preventDefault();
                resetScroll();
            }
        };

        // Check immediately
        resetScroll();

        // Prevent scroll at capture phase (earliest possible)
        window.addEventListener('scroll', preventScroll, { capture: true, passive: false });
        document.addEventListener('scroll', preventScroll, { capture: true, passive: false });

        // High-frequency polling to catch any scroll that slips through (60fps)
        const interval = setInterval(resetScroll, 16);

        return () => {
            window.removeEventListener('scroll', preventScroll, { capture: true });
            document.removeEventListener('scroll', preventScroll, { capture: true });
            clearInterval(interval);
        };
    }, [isKeyboardOpen]);

    // DIAGNOSTIC: Log element positions to detect what's animating
    useEffect(() => {
        if (!isKeyboardOpen) return;

        const logPositions = (label: string) => {
            const chatContainer = document.querySelector('[data-chat-container]');
            const header = document.querySelector('[data-chat-header]');
            const input = document.querySelector('[data-chat-input]');
            const rootContainer = document.body;

            const getElementInfo = (el: Element | null, name: string) => {
                if (!el) return { [name]: 'NOT_FOUND' };
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    [name]: {
                        top: rect.top,
                        bottom: rect.bottom,
                        height: rect.height,
                        transform: style.transform,
                        transition: style.transition,
                    }
                };
            };

            console.log(`📍 [ELEMENT POSITIONS - ${label}]`, {
                timestamp: new Date().toISOString(),
                ...getElementInfo(chatContainer, 'chatContainer'),
                ...getElementInfo(header, 'header'),
                ...getElementInfo(input, 'input'),
                body: {
                    scrollTop: document.body.scrollTop,
                    classList: Array.from(document.body.classList),
                }
            });
        };

        // Log immediately
        logPositions('KEYBOARD_OPEN');

        // Log at various intervals to catch animation
        const timers = [
            setTimeout(() => logPositions('AFTER_100ms'), 100),
            setTimeout(() => logPositions('AFTER_300ms'), 300),
            setTimeout(() => logPositions('AFTER_500ms'), 500),
            setTimeout(() => logPositions('AFTER_800ms'), 800),
            setTimeout(() => logPositions('AFTER_1000ms'), 1000),
            setTimeout(() => logPositions('AFTER_1500ms'), 1500),
        ];

        return () => timers.forEach(t => clearTimeout(t));
    }, [isKeyboardOpen]);

    useEffect(() => {
        // Fetch chat history
        const fetchHistory = async () => {
            console.log('📥 Fetching chat history for avatar:', avatar.id);
            const startTime = Date.now();
            try {
                const response = await fetch(`/api/chat?avatarId=${avatar.id}&initData=${encodeURIComponent(initData)}`);
                console.log('📥 Chat history response status:', response.status, 'Time:', Date.now() - startTime, 'ms');
                if (response.ok) {
                    const data = await response.json();
                    // Ensure all messages have IDs
                    const messagesWithIds = data.messages.map((msg: any, index: number) => ({
                        ...msg,
                        id: msg.id || `history-${index}-${Date.now()}`
                    }));
                    console.log('📥 Loaded messages:', messagesWithIds.length);
                    setMessages(messagesWithIds);
                }
            } catch (error) {
                console.error('❌ Failed to fetch chat history:', error);
            }
        };

        fetchHistory();
    }, [avatar.id, initData]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        selection(); // Haptic feedback

        const userMessage: Message = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    avatarId: avatar.id,
                    initData
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            // Simulate typing delay based on message length
            const parts = data.response.match(/.{1,150}(?:\s|$)/g) || [data.response];

            for (let i = 0; i < parts.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

                if (i === parts.length - 1) {
                    setIsTyping(false);
                    setIsLoading(false);
                    notification('success'); // Haptic feedback on completion
                }

                setMessages(prev => [...prev, {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: 'assistant',
                    content: parts[i]
                }]);
            }
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    return (
        <div
            data-chat-container
            className={`flex flex-col chat-interface ${isKeyboardOpen ? 'keyboard-open' : ''}`}
            style={{
                // CRITICAL: When keyboard is open, use INITIAL height to prevent container from shrinking
                // This keeps header and content at their original positions
                height: isKeyboardOpen && initialViewportHeightRef.current > 0
                    ? `${initialViewportHeightRef.current}px`
                    : 'var(--tg-viewport-height, 100vh)',
                maxHeight: isKeyboardOpen && initialViewportHeightRef.current > 0
                    ? `${initialViewportHeightRef.current}px`
                    : 'var(--tg-viewport-height, 100vh)',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                // CRITICAL: Disable transition when keyboard is open to prevent header animation
                transition: isKeyboardOpen ? 'none' : undefined,
            }}
        >
            {/* Fixed Background Color - Layer 0 */}
            {/* REMOVED: Using Page.tsx background */}

            {/* Header - In flex flow, Layer 20 */}
            {/* 
                ISSUE DISCOVERED: Telegram SDK returns contentSafeAreaInsets.top = 46px (Telegram UI only)
                but does NOT include device safe area (status bar ~44px on iOS).
                
                SOLUTION: Use both --tg-safe-area-inset-top (device) + --tg-content-safe-area-inset-top (Telegram UI)
                This ensures we account for BOTH:
                1. Device safe area (status bar/notch) from safeAreaInsets
                2. Telegram UI elements (back button, menu) from contentSafeAreaInsets
                
                Expected total: ~90px on iOS (44px device + 46px Telegram)
            */}
            <div
                data-chat-header
                data-fixed-during-keyboard
                className="w-full flex items-center justify-between z-20 backdrop-blur-md shrink-0 rounded-bl-[24px] rounded-br-[24px]"
                style={{
                    // CRITICAL: Use fixed positioning when keyboard is open to prevent iOS viewport animation
                    position: isKeyboardOpen ? 'fixed' : 'relative',
                    top: isKeyboardOpen ? 0 : undefined,
                    left: isKeyboardOpen ? 0 : undefined,
                    right: isKeyboardOpen ? 0 : undefined,
                    paddingTop: '93px', // Fixed: 47px (safe-area) + 46px (content-safe-area)
                    paddingBottom: '12px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    opacity: isMounted && !isExiting ? 1 : 0,
                    transform: isExiting ? 'translateY(-100%)' : (isMounted ? 'translateY(0)' : 'translateY(-20px)'),
                    willChange: 'opacity, transform',
                    // Disable transitions during keyboard events to prevent UI jump
                    transition: isKeyboardOpen
                        ? 'none'
                        : 'opacity 600ms cubic-bezier(0.4,0,0.2,1), transform 600ms cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                <span className="font-semibold text-lg text-white">Элис</span>

                {/* Clear History Button */}
                <button
                    onClick={async () => {
                        selection(); // Haptic feedback
                        setMessages([]); // Clear local messages

                        // Clear from backend
                        try {
                            await fetch(`/api/chat?initData=${encodeURIComponent(initData)}`, {
                                method: 'DELETE'
                            });
                            console.log('✅ Chat history cleared from backend');
                        } catch (error) {
                            console.error('❌ Failed to clear chat history from backend:', error);
                        }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/10 transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.7599 6.53322L10.0533 3.70655C9.41328 2.66655 8.14661 2.07988 6.95995 2.42655C5.17328 2.95988 4.47995 4.97322 5.37328 6.45322L7.13328 9.34655C7.33328 9.65322 7.74661 9.75988 8.05328 9.57322L11.5333 7.45322C11.8533 7.25322 11.9599 6.83988 11.7599 6.53322Z" fill="white" />
                        <path d="M26.32 18.9465L22.5733 13.8798C21.2666 12.1198 19 11.2931 16.8666 11.8665C16.8666 11.8531 16.8533 11.8531 16.8533 11.8398L14.64 8.19979C14.24 7.57312 13.4133 7.37312 12.7866 7.75979L8.15996 10.5731C7.51996 10.9465 7.31996 11.7865 7.70663 12.4265L9.90663 16.0665C9.90663 16.0665 9.90663 16.0798 9.91996 16.0798C8.43996 17.7198 8.11996 20.1065 9.10663 22.0931L11.88 27.7465C12.7333 29.4931 14.7466 30.1598 16.4533 29.2798C16.5866 29.2131 16.6266 29.0531 16.5466 28.9198L14.4666 25.4798C14.1733 24.9998 14.32 24.3865 14.8 24.0798C15.28 23.7998 15.8933 23.9465 16.2 24.4131L18.2933 27.8531C18.3733 27.9731 18.5333 28.0131 18.6533 27.9465L19.9333 27.1731C20.0533 27.0931 20.0933 26.9331 20.0266 26.8131L17.9333 23.3731C17.6533 22.8931 17.8 22.2798 18.2666 21.9731C18.76 21.6931 19.3733 21.8398 19.6666 22.3065L21.76 25.7465C21.84 25.8665 22 25.9065 22.12 25.8398L23.4 25.0665C23.52 24.9865 23.56 24.8265 23.4933 24.7065L21.4 21.2665C21.12 20.7865 21.2666 20.1731 21.7333 19.8665C22.2266 19.5865 22.84 19.7331 23.1333 20.1998L25.24 23.6265C25.32 23.7465 25.48 23.7865 25.6 23.7065C27.1466 22.5998 27.4933 20.5198 26.32 18.9465Z" fill="white" />
                    </svg>
                </button>
            </div>


            {/* Background Image Layer - REMOVED */}

            {/* Bottom Gradient Shadow - Fixed (z-2) */}
            <div
                className="fixed bottom-0 left-0 right-0 z-[2] bg-gradient-to-t from-[#100024] via-[#100024]/90 to-transparent"
                style={{
                    // Gradient height should match space between content and input
                    height: 'calc(85px + max(var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 34px)))',
                    opacity: isMounted && !isExiting ? 0.95 : 0,
                    transition: 'opacity 600ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                }}
            />

            {/* Messages Container - flex-1, fills space between header and input (z-10) */}
            <div className="flex-1 relative z-10 overflow-hidden">
                <BounceEffect
                    className="h-full"
                >
                    <div
                        className="px-4 py-4 space-y-3 flex flex-col min-h-full justify-end"
                        style={{
                            paddingBottom: 'calc(85px + max(var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 34px)))'
                        }}
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} transition-opacity duration-300`}
                                style={{
                                    animation: 'fadeIn 0.3s ease-out',
                                    opacity: isExiting ? 0 : 1,
                                    transition: 'opacity 300ms ease-out'
                                }}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-gradient-to-b from-[rgba(255,173,58,0.9)] to-[rgba(255,173,58,0.8)] text-white backdrop-blur-[15px]'
                                        : 'backdrop-blur-[25px] text-white'
                                        }`}
                                    style={{
                                        backgroundColor: msg.role === 'assistant' ? 'rgba(255, 255, 255, 0.1)' : undefined,
                                        boxShadow: msg.role === 'user' ? '0px 2px 8px rgba(255,173,58,0.2)' : 'none'
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div
                                    className="backdrop-blur-[25px] rounded-2xl px-4 py-3"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </BounceEffect>
            </div>

            {/* Input Area Wrapper - Fixed positioning for smooth keyboard interaction */}
            <div
                className="w-full shrink-0 fixed z-20"
                style={{
                    bottom: 0,
                    left: 0,
                    right: 0,
                }}
            >
                {/* Input Area - Layer 2 */}
                <div
                    data-input-area
                    className="w-full backdrop-blur-md rounded-tl-[24px] rounded-tr-[24px]"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        paddingTop: '16px',
                        paddingBottom: 'calc(max(var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 34px)) + 12px)',
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        // Force no transform when keyboard is open
                        transform: isExiting || isKeyboardOpen
                            ? 'translateY(0)'
                            : (isMounted ? 'translateY(0)' : 'translateY(100%)'),
                        willChange: 'transform',
                        // Completely disable transitions during keyboard events
                        transition: isKeyboardOpen || isExiting ? 'none' : 'transform 600ms cubic-bezier(0.4, 0.0, 0.2, 1)'
                    }}
                >
                    <div className="flex items-center" style={{ gap: '8px' }}>
                        <input
                            data-chat-input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className={`flex-1 rounded-full px-5 py-3 focus:outline-none backdrop-blur-[15px] text-white placeholder-white/40 ${isKeyboardOpen ? '' : 'transition-all duration-200'}`}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }}
                            onFocus={(e) => {
                                // CRITICAL: Add class IMMEDIATELY via DOM to disable transitions
                                // This works INSTANTLY, without waiting for React re-render
                                document.body.classList.add('keyboard-active');

                                // Disable transition on chat container to prevent header animation
                                const chatContainer = document.querySelector('[data-chat-container]') as HTMLElement;
                                if (chatContainer) {
                                    chatContainer.style.transition = 'none';
                                }

                                // Also disable transition on parent input-area container
                                const inputArea = e.currentTarget.closest('[data-input-area]') as HTMLElement;
                                if (inputArea) {
                                    inputArea.style.transition = 'none';
                                }

                                // IMMEDIATELY notify parent to disable transitions (React state backup)
                                onInputFocusChange?.(true);

                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';

                                // AGGRESSIVE iOS scroll prevention
                                // iOS scrolls the page automatically when focusing on input
                                // We need to counter this BEFORE it happens visually

                                // Immediate sync reset
                                window.scrollTo(0, 0);

                                // Prevent default iOS behavior by locking scroll during focus transition
                                document.body.style.overflow = 'hidden';
                                document.documentElement.style.overflow = 'hidden';

                                // Multiple RAF frames to catch iOS scroll at different stages
                                const resetScroll = () => {
                                    window.scrollTo(0, 0);
                                    document.body.scrollTop = 0;
                                    document.documentElement.scrollTop = 0;
                                };

                                // Chain of RAF to catch all possible scroll moments
                                resetScroll();
                                requestAnimationFrame(() => {
                                    resetScroll();
                                    requestAnimationFrame(() => {
                                        resetScroll();
                                        requestAnimationFrame(() => {
                                            resetScroll();
                                            // Additional delayed resets for iOS keyboard animation
                                            setTimeout(resetScroll, 0);
                                            setTimeout(resetScroll, 16);
                                            setTimeout(resetScroll, 50);
                                            setTimeout(resetScroll, 100);
                                            setTimeout(resetScroll, 150);
                                            setTimeout(resetScroll, 200);
                                        });
                                    });
                                });
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                // Notify parent that input lost focus
                                onInputFocusChange?.(false);
                                // Remove keyboard-active class after a delay to allow closing animation
                                setTimeout(() => {
                                    document.body.classList.remove('keyboard-active');
                                }, 100);
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="w-10 h-10 rounded-full disabled:opacity-50 transition-all duration-200 flex items-center justify-center active:scale-95"
                            style={{
                                background: 'linear-gradient(to bottom, rgba(255,173,58,0.9), rgba(255,173,58,0.8))',
                                boxShadow: '0px 2px 8px rgba(255,173,58,0.3)'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Debug Tools - Copy Logs Button */}
            {isDev && (
                <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2">
                    <button
                        onClick={async () => {
                            const success = await copyLogs();
                            if (success) {
                                notification('success');
                            } else {
                                notification('error');
                            }
                        }}
                        className="bg-blue-500 text-white rounded-full p-4 shadow-lg active:scale-95 transition-transform"
                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.95)' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5H6C5.46957 5 4.96086 5.21071 4.58579 5.58579C4.21071 5.96086 4 6.46957 4 7V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 5C8 4.46957 8.21071 3.96086 8.58579 3.58579C8.96086 3.21071 9.46957 3 10 3H18C18.5304 3 19.0391 3.21071 19.4142 3.58579C19.7893 3.96086 20 4.46957 20 5V15C20 15.5304 19.7893 16.0391 19.4142 16.4142C19.0391 16.7893 18.5304 17 18 17H10C9.46957 17 8.96086 16.7893 8.58579 16.4142C8.21071 16.0391 8 15.5304 8 15V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                            {logsCount}
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            clearLogs();
                            selection();
                        }}
                        className="bg-red-500 text-white rounded-full p-4 shadow-lg active:scale-95 transition-transform"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

