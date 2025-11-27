import React, { useState } from 'react';
import { Avatar, AVATARS } from '../lib/bot/prompts';
import { useHaptic } from '../hooks/useHaptic';

interface AvatarSliderProps {
    selectedAvatar: Avatar | null;
    onSelect: (avatar: Avatar) => void;
    onClose: () => void;
}

export function AvatarSlider({ selectedAvatar, onSelect, onClose }: AvatarSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(
        selectedAvatar ? AVATARS.findIndex(a => a.id === selectedAvatar.id) : 0
    );
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const { impact, selection, notification } = useHaptic();

    const currentAvatar = AVATARS[currentIndex];

    const handlePrevious = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : AVATARS.length - 1;
        setCurrentIndex(newIndex);
        onSelect(AVATARS[newIndex]);
        impact('soft');
    };

    const handleNext = () => {
        const newIndex = currentIndex < AVATARS.length - 1 ? currentIndex + 1 : 0;
        setCurrentIndex(newIndex);
        onSelect(AVATARS[newIndex]);
        selection();
    };

    // Swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleNext();
        }
        if (isRightSwipe) {
            handlePrevious();
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    const toggleGender = () => {
        // For now, just cycle through all avatars
        // In production, this would filter by gender
        handleNext();
        impact('light');
    };

    return (
        <div className="w-full bg-[rgba(255,255,255,0.05)] backdrop-blur-md rounded-tl-[24px] rounded-tr-[24px] p-4 pb-[34px] flex flex-col gap-4 h-[280px]">
            {/* Title Row with Close and Gender Toggle */}
            <div className="w-full flex items-center justify-between">
                {/* Close Button */}
                <button
                    onClick={() => {
                        onClose();
                        impact('light');
                    }}
                    className="p-2 backdrop-blur-[25px] bg-gradient-to-b from-[rgba(255,255,255,0.25)] to-[rgba(255,255,255,0)] rounded-full shadow-[0px_1px_2px_rgba(255,255,255,0.15)_inset] transition-all active:scale-95"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Title */}
                <h2 className="text-white text-lg font-bold flex-1 text-center">
                    {currentAvatar.name}
                </h2>

                {/* Gender Toggle Button */}
                <button
                    onClick={toggleGender}
                    className="p-2 backdrop-blur-[25px] bg-gradient-to-b from-[rgba(255,255,255,0.25)] to-[rgba(255,255,255,0)] rounded-full shadow-[0px_1px_2px_rgba(255,255,255,0.15)_inset] transition-all active:scale-95"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white" />
                        <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Content - Description with swipe support */}
            <div
                className="w-full flex flex-col gap-4 flex-1"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Description - Fixed height for 4 lines, centered */}
                <div className="h-[80px] flex items-center justify-center">
                    <p className="text-white/60 text-sm leading-relaxed text-center px-4 line-clamp-4">
                        {currentAvatar.prompt.split('\n')[0]}
                    </p>
                </div>

                {/* Pagination Dots */}
                <div className="flex items-center justify-center gap-2">
                    {AVATARS.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'w-6 bg-[#FFAD3A]'
                                : 'w-1.5 bg-white/30'
                                }`}
                        />
                    ))}
                </div>

                {/* Select Button */}
                <button
                    onClick={() => {
                        onSelect(currentAvatar);
                        notification('success');
                    }}
                    className="w-full py-3 backdrop-blur-[25px] bg-gradient-to-b from-[rgba(255,255,255,0.25)] to-[rgba(255,255,255,0.1)] rounded-full shadow-[0px_1px_2px_rgba(255,255,255,0.15)_inset] text-white text-sm font-bold transition-all active:scale-95"
                >
                    Выбрать
                </button>
            </div>
        </div>
    );
}
