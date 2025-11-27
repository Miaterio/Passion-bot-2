import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '../lib/bot/prompts';

interface ChatInterfaceProps {
    avatar: Avatar;
    onBack: () => void;
    initData?: string;
    onClear?: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

function splitMessage(text: string) {
    const parts = text.split(/\n\s*\n/g).filter((part) => part.trim().length > 0);
    const finalParts = [];
    const MAX_PART_LENGTH = 600;
    for (const part of parts) {
        if (part.length > MAX_PART_LENGTH) {
            const words = part.split(" ");
            let currentChunk = "";
            for (const word of words) {
                if ((currentChunk + word).length > MAX_PART_LENGTH && currentChunk) {
                    finalParts.push(currentChunk.trim());
                    currentChunk = word + " ";
                } else {
                    currentChunk += word + " ";
                }
            }
            if (currentChunk.trim()) finalParts.push(currentChunk.trim());
        } else {
            finalParts.push(part.trim());
        }
    }
    return finalParts;
}

export function ChatInterface({ avatar, onBack, initData, onClear }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Keyboard handling: Scroll input into view on focus/resize
    useEffect(() => {
        const handleResize = () => {
            if (document.activeElement === inputRef.current) {
                inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load initial history
    useEffect(() => {
        // In production, we need initData. In dev, API handles fallback.
        // So we proceed even if initData is empty, but we pass it if it exists.

        const fetchHistory = async () => {
            try {
                const url = initData
                    ? `/api/chat?initData=${encodeURIComponent(initData)}`
                    : '/api/chat'; // API will handle fallback for dev

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages) {
                        // Split assistant messages into parts for display
                        const splitMessages: Message[] = [];
                        for (const msg of data.messages) {
                            if (msg.role === 'assistant') {
                                const parts = splitMessage(msg.content);
                                for (const part of parts) {
                                    splitMessages.push({ role: 'assistant', content: part });
                                }
                            } else {
                                splitMessages.push(msg);
                            }
                        }
                        setMessages(splitMessages);
                    }
                }
            } catch (e) {
                console.error("Failed to load history:", e);
            }
        };

        fetchHistory();
    }, [initData]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    avatarId: avatar.id,
                    initData: initData,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const fullResponse = data.response;
            const parts = splitMessage(fullResponse);

            // Display parts with delay
            for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                    setIsTyping(true);
                    const baseDelay = Math.min(10000, Math.max(1000, parts[i].length * 10));
                    const randomDelay = Math.random() * 2000;
                    await new Promise((r) => setTimeout(r, baseDelay + randomDelay));
                } else {
                    // First part comes immediately after generation (or maybe small delay for realism?)
                    // The generation itself took time, so immediate is fine.
                    setIsTyping(false);
                }

                setIsTyping(false);
                setMessages((prev) => [...prev, { role: 'assistant', content: parts[i] }]);
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '😔 Произошла ошибка. Попробуй еще раз.' },
            ]);
            setIsTyping(false);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    // Expose clear method via prop if needed, but actually the parent calls API?
    // Wait, the plan said "Add a onClear prop... when parent triggers it".
    // So the parent (Page) handles the button click, calls API, then calls onClear to update UI.
    // We need to expose a way to clear messages.
    // Actually, if we pass `messages` as prop it would be controlled.
    // But here it's uncontrolled.
    // We can use `useImperativeHandle` or just a `key` prop on ChatInterface to reset it.
    // Or, better: The parent passes a `clearTrigger` prop?
    // Let's stick to the plan: "Add a onClear prop...".
    // Wait, if the parent calls API, how does ChatInterface know to clear `messages` state?
    // Maybe `onClear` is a callback FROM ChatInterface TO Parent? No.
    // Let's assume the parent will remount ChatInterface or we use a ref.
    // Actually, simplest is: Parent handles the API call, and if successful, forces ChatInterface to clear.
    // Or, ChatInterface exposes a `clear()` function.
    // Let's implement `clear()` via `useImperativeHandle` if we were using refs, but simpler:
    // Pass a `lastClearTimestamp` prop?
    // Or just let the parent handle the UI state?
    // Let's assume for now the parent will handle the API call and we might need to reload history.
    // Actually, if the parent clears history, `messages` should become empty.
    // Let's add a `useEffect` that listens to a prop or just expose a method.
    // I'll add a `clearMessages` method to the component and wrap it in `forwardRef`.
    // BUT, to keep it simple and avoid major refactor to forwardRef:
    // I will export `ChatInterface` as is, and maybe the parent can just change a `key` to reset it.
    // Changing `key` is the cleanest way to reset state.

    return (
        <div className="w-full h-full relative">
            {/* Header - Absolute Top */}
            <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4 z-30 pointer-events-none">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <span className="text-white font-medium text-lg drop-shadow-md">{avatar.name}</span>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Messages - Absolute Full + Mask */}
            <div
                className="absolute inset-0 overflow-y-auto p-4 space-y-4 z-0"
                style={{
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                    paddingTop: '80px',
                    paddingBottom: '100px'
                }}
            >
                {messages.length === 0 && (
                    <div className="text-center text-white/40 mt-10">
                        Начни общение с {avatar.name}...
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-2xl backdrop-blur-[25px] ${msg.role === 'user'
                                ? 'bg-[#FFAD3A] text-black rounded-tr-none'
                                : 'bg-white/10 text-white rounded-tl-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 text-white/60 p-3 rounded-2xl rounded-tl-none backdrop-blur-[25px]">
                            Печатает...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Absolute Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-4 z-30">
                <div className="flex gap-2 items-end">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "end" })}
                        placeholder="Напиши сообщение..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#FFAD3A] backdrop-blur-md"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-[#FFAD3A] text-black rounded-full w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
