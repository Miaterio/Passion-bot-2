import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '../lib/bot/prompts';

interface ChatInterfaceProps {
    avatar: Avatar;
    onBack: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatInterface({ avatar, onBack }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    avatarId: avatar.id,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '😔 Произошла ошибка. Попробуй еще раз.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md shrink-0">
                <button onClick={onBack} className="text-white/80 hover:text-white">
                    ← Назад
                </button>
                <span className="text-white font-medium">{avatar.name}</span>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                            className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user'
                                ? 'bg-[#FFAD3A] text-black rounded-tr-none'
                                : 'bg-white/10 text-white rounded-tl-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 text-white/60 p-3 rounded-2xl rounded-tl-none">
                            Печатает...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/20 backdrop-blur-md shrink-0">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Напиши сообщение..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#FFAD3A]"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-[#FFAD3A] text-black rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
