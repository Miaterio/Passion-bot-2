import { useState, useRef, useEffect } from 'react';
import { BounceEffect } from '../../components/BounceEffect/BounceEffect';
import { Avatar } from '../lib/bot/prompts';
import { useHaptic } from '../hooks/useHaptic';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    avatar: Avatar;
    onBack: () => void;
    initData: string;
}

export function ChatInterface({ avatar, onBack, initData }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isAnimationComplete, setIsAnimationComplete] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { selection, notification } = useHaptic();

    // Mount animation with state transition
    useEffect(() => {
        // Trigger entrance animation after a small delay to let layout settle
        const mountTimer = setTimeout(() => setIsMounted(true), 100);
        // Switch to static positioning after animation completes (100ms delay + 600ms animation)
        const animationTimer = setTimeout(() => setIsAnimationComplete(true), 700);
        return () => {
            clearTimeout(mountTimer);
            clearTimeout(animationTimer);
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
        <div className="w-full h-full relative overflow-hidden flex flex-col" style={{
            height: 'var(--tg-viewport-height, 100vh)',
            maxHeight: 'var(--tg-viewport-height, 100vh)'
        }}>
            {/* Fixed Background Color - Layer 0 */}
            <div className="fixed inset-0 bg-[#100024] z-0" />

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
                className="w-full flex items-center justify-between z-20 backdrop-blur-md transition-all duration-[600ms] shrink-0 rounded-bl-[24px] rounded-br-[24px]"
                style={{
                    paddingTop: 'calc(var(--tg-safe-area-inset-top, 44px) + var(--tg-content-safe-area-inset-top, 46px))',
                    paddingBottom: '16px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    opacity: isMounted ? 1 : 0,
                    transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
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


            {/* Background Image Layer - Fixed, ends at input top (z-1) */}
            <div
                className="fixed z-[1] flex items-end justify-center"
                style={{
                    // Top offset = header safe areas + header padding + header content
                    top: 'calc(var(--tg-safe-area-inset-top, 44px) + var(--tg-content-safe-area-inset-top, 46px) + 56px)',
                    left: 0,
                    right: 0,
                    // Bottom offset = input padding + input height + safe area
                    bottom: 'calc(85px + max(var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 34px)))',
                }}
            >
                <div
                    className="relative"
                    style={{
                        width: '100%',
                        height: '100%',
                        opacity: isMounted ? 0.15 : 0,
                        transform: isMounted ? 'translateY(0) scale(1.05)' : 'translateY(100px) scale(1.1)',
                        transition: 'all 600ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                        willChange: 'opacity, transform',
                    }}
                >
                    <img
                        className="w-full h-full object-contain"
                        src={avatar.bgImage}
                        alt=""
                    />
                </div>
            </div>

            {/* Bottom Gradient Shadow - Fixed (z-2) */}
            <div
                className="fixed bottom-0 left-0 right-0 z-[2] bg-gradient-to-t from-[#100024] via-[#100024]/90 to-transparent"
                style={{
                    // Gradient height should match space between content and input
                    height: 'calc(85px + max(var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 34px)))',
                    opacity: isMounted ? 0.95 : 0,
                    transition: 'opacity 600ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                }}
            />

            {/* Messages Container - flex-1, fills space between header and input (z-10) */}
            <div className="flex-1 relative z-10 overflow-hidden">
                <BounceEffect
                    className="h-full"
                >
                    <div className="px-4 py-4 space-y-3 flex flex-col min-h-full justify-end">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} transition-opacity duration-300`}
                                style={{
                                    animation: 'fadeIn 0.3s ease-out'
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

            {/* Input Area Wrapper - Transitions from fixed to flex */}
            <div
                className="w-full shrink-0 relative z-20"
                style={{
                    position: isAnimationComplete ? 'static' : 'fixed',
                    bottom: isAnimationComplete ? 'auto' : 0,
                    left: isAnimationComplete ? 'auto' : 0,
                    right: isAnimationComplete ? 'auto' : 0,
                }}
            >
                <div
                    className="w-full backdrop-blur-md transition-all duration-[600ms] rounded-tl-[24px] rounded-tr-[24px]"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        paddingTop: '16px',
                        paddingBottom: 'calc(max(var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 34px)) + 12px)',
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        transform: isAnimationComplete ? 'none' : (isMounted ? 'translateY(0)' : 'translateY(100%)'),
                        willChange: isAnimationComplete ? 'auto' : 'transform',
                        transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 rounded-full px-5 py-3 focus:outline-none backdrop-blur-[15px] transition-all duration-200 text-white placeholder-white/40"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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

