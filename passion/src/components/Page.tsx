'use client';

import React from 'react';

// Placeholder for the broom icon since we don't have the asset file
const BroomIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="white" fillOpacity="0.2" />
    </svg>
);

// Using the local asset URL from Figma - this might need to be replaced with a real asset later
const imgBgAvatar = "http://localhost:3845/assets/2c0c91bf5d30383167a5d21559458375fabb8747.png";

function Clear({ className }: { className?: string }) {
    return (
        <div className={className} data-name="clear" data-node-id="1:1112">
            <div className="absolute contents inset-0" data-name="vuesax/bold/broom" data-node-id="1:1113">
                <BroomIcon className="block max-w-none size-full" />
            </div>
        </div>
    );
}

type ButtonProps = {
    className?: string;
    state?: "Default" | "Active";
};

function Button({ className, state = "Default" }: ButtonProps) {
    return (
        <div className={className} data-name="State=Default" data-node-id="1:1120">
            <Clear className="relative shrink-0 size-[32px]" />
            <div className="absolute inset-0 pointer-events-none shadow-[0px_1px_2px_0px_inset_rgba(255,255,255,0.15)] rounded-[inherit]" />
        </div>
    );
}

export default function Page() {
    return (
        <div className="bg-[#100024] content-stretch flex flex-col isolate items-start justify-center relative size-full min-h-screen overflow-hidden" data-name="390x844" data-node-id="1:875">
            {/* Status Bar Placeholder - usually handled by system */}
            <div className="h-[44px] shrink-0 w-full z-[6]" data-name="Status Bar" data-node-id="1:876" />

            {/* Telegram UI Placeholder */}
            <div className="h-[46px] shrink-0 w-full z-[5]" data-name="Telegram UI" data-node-id="1:877" />

            <div className="basis-0 box-border content-stretch flex flex-col grow isolate items-center justify-between min-h-px min-w-px pb-[24px] pt-[16px] px-[16px] relative shrink-0 w-full z-[4]" data-name="tg-content-safe-area-inset" data-node-id="1:878">
                <div className="box-border content-stretch flex items-center justify-between mb-[-24px] relative shrink-0 w-full z-[2]" data-name="Top Buttons" data-node-id="1:879">
                    <Button className="backdrop-blur-[25px] backdrop-filter bg-gradient-to-b box-border content-stretch flex from-[rgba(255,255,255,0.25)] gap-[10px] items-center p-[12px] relative rounded-[40px] shrink-0 to-[rgba(255,255,255,0)]" />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-[3]" data-name="HomeIndicator" data-node-id="1:887">
                <div className="bg-white bottom-[8px] h-[5px] mx-auto rounded-[100px] w-[134px]" data-name="Home Indicator" />
            </div>

            <div className="absolute bg-gradient-to-t bottom-0 from-[#100024] h-[200px] left-0 to-[rgba(16,0,36,0)] w-full z-[2]" data-name="Bottom Shadow" data-node-id="1:888" />

            <div className="absolute inset-0 z-[1]" data-name="BG - Avatar" data-node-id="1:889">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBgAvatar} />
            </div>
        </div>
    );
}
