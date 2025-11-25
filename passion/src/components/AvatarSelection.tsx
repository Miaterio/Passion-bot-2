import React from 'react';
import { AVATARS, Avatar } from '../lib/bot/prompts';

interface AvatarSelectionProps {
    onSelect: (avatar: Avatar) => void;
}

export function AvatarSelection({ onSelect }: AvatarSelectionProps) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-4 overflow-y-auto">
            <h1 className="text-2xl font-bold text-white mb-4">Выбери собеседника</h1>
            <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                {AVATARS.map((avatar) => (
                    <button
                        key={avatar.id}
                        onClick={() => onSelect(avatar)}
                        className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-left group"
                    >
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#FFAD3A] transition-colors">
                            {avatar.name}
                        </h3>
                        <p className="text-sm text-white/60 mt-1 line-clamp-2">
                            {avatar.prompt.split('\n')[0]}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
