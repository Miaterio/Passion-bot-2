'use client';

import React from 'react';

const imgBgAvatar = "/bg-avatar.png";

// Icon Components using actual Vuesax Bold SVG paths
const BroomIcon = ({ fill = "white" }: { fill?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.7599 6.53322L10.0533 3.70655C9.41328 2.66655 8.14661 2.07988 6.95995 2.42655C5.17328 2.95988 4.47995 4.97322 5.37328 6.45322L7.13328 9.34655C7.33328 9.65322 7.74661 9.75988 8.05328 9.57322L11.5333 7.45322C11.8533 7.25322 11.9599 6.83988 11.7599 6.53322Z" fill={fill} />
    <path d="M26.32 18.9465L22.5733 13.8798C21.2666 12.1198 19 11.2931 16.8666 11.8665C16.8666 11.8531 16.8533 11.8531 16.8533 11.8398L14.64 8.19979C14.24 7.57312 13.4133 7.37312 12.7866 7.75979L8.15996 10.5731C7.51996 10.9465 7.31996 11.7865 7.70663 12.4265L9.90663 16.0665C9.90663 16.0665 9.90663 16.0798 9.91996 16.0798C8.43996 17.7198 8.11996 20.1065 9.10663 22.0931L11.88 27.7465C12.7333 29.4931 14.7466 30.1598 16.4533 29.2798C16.5866 29.2131 16.6266 29.0531 16.5466 28.9198L14.4666 25.4798C14.1733 24.9998 14.32 24.3865 14.8 24.0798C15.28 23.7998 15.8933 23.9465 16.2 24.4131L18.2933 27.8531C18.3733 27.9731 18.5333 28.0131 18.6533 27.9465L19.9333 27.1731C20.0533 27.0931 20.0933 26.9331 20.0266 26.8131L17.9333 23.3731C17.6533 22.8931 17.8 22.2798 18.2666 21.9731C18.76 21.6931 19.3733 21.8398 19.6666 22.3065L21.76 25.7465C21.84 25.8665 22 25.9065 22.12 25.8398L23.4 25.0665C23.52 24.9865 23.56 24.8265 23.4933 24.7065L21.4 21.2665C21.12 20.7865 21.2666 20.1731 21.7333 19.8665C22.2266 19.5865 22.84 19.7331 23.1333 20.1998L25.24 23.6265C25.32 23.7465 25.48 23.7865 25.6 23.7065C27.1466 22.5998 27.4933 20.5198 26.32 18.9465Z" fill={fill} />
  </svg>
);

const FlashIcon = ({ fill = "white" }: { fill?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.88 14.2934H19.76V4.69336C19.76 2.45336 18.5467 2.00003 17.0667 3.68003L16 4.89336L6.97335 15.16C5.73335 16.56 6.25335 17.7067 8.12002 17.7067H12.24V27.3067C12.24 29.5467 13.4533 30 14.9333 28.32L16 27.1067L25.0267 16.84C26.2667 15.44 25.7467 14.2934 23.88 14.2934Z" fill={fill} />
  </svg>
);

const HomeIcon = ({ fill = "#FFAD3A" }: { fill?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27.7734 10.6799L19.04 3.69319C17.3334 2.3332 14.6667 2.31986 12.9734 3.67986L4.24003 10.6799C2.9867 11.6799 2.2267 13.6799 2.49337 15.2532L4.17337 25.3065C4.56003 27.5599 6.65336 29.3332 8.93337 29.3332H23.0667C25.32 29.3332 27.4534 27.5199 27.84 25.2932L29.52 15.2399C29.76 13.6799 29 11.6799 27.7734 10.6799ZM17 23.9999C17 24.5465 16.5467 24.9999 16 24.9999C15.4534 24.9999 15 24.5465 15 23.9999V19.9999C15 19.4532 15.4534 18.9999 16 18.9999C16.5467 18.9999 17 19.4532 17 19.9999V23.9999Z" fill={fill} />
  </svg>
);

const SettingIcon = ({ fill = "white" }: { fill?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.5866 2.6665H10.4133C5.55996 2.6665 2.66663 5.55984 2.66663 10.4132V21.5732C2.66663 26.4398 5.55996 29.3332 10.4133 29.3332H21.5733C26.4266 29.3332 29.32 26.4398 29.32 21.5865V10.4132C29.3333 5.55984 26.44 2.6665 21.5866 2.6665ZM10.2266 7.33317C10.2266 6.7865 10.68 6.33317 11.2266 6.33317C11.7733 6.33317 12.2266 6.7865 12.2266 7.33317V12.5332C12.2266 13.0798 11.7733 13.5332 11.2266 13.5332C10.68 13.5332 10.2266 13.0798 10.2266 12.5332V7.33317ZM12.5817 21.9571C12.3753 22.0405 12.2266 22.233 12.2266 22.4556V24.6665C12.2266 25.2132 11.7733 25.6665 11.2266 25.6665C10.68 25.6665 10.2266 25.2132 10.2266 24.6665V22.4556C10.2266 22.233 10.0779 22.0405 9.87155 21.957C8.53731 21.4172 7.59996 20.1215 7.59996 18.5998C7.59996 16.5998 9.22663 14.9598 11.2266 14.9598C13.2266 14.9598 14.8666 16.5865 14.8666 18.5998C14.8666 20.1215 13.9179 21.4173 12.5817 21.9571ZM21.7733 24.6665C21.7733 25.2132 21.32 25.6665 20.7733 25.6665C20.2266 25.6665 19.7733 25.2132 19.7733 24.6665V19.4665C19.7733 18.9198 20.2266 18.4665 20.7733 18.4665C21.32 18.4665 21.7733 18.9198 21.7733 19.4665V24.6665ZM20.7733 17.0265C18.7733 17.0265 17.1333 15.3998 17.1333 13.3865C17.1333 11.8648 18.082 10.569 19.4182 10.0293C19.6246 9.94589 19.7733 9.75331 19.7733 9.53071V7.33317C19.7733 6.7865 20.2266 6.33317 20.7733 6.33317C21.32 6.33317 21.7733 6.7865 21.7733 7.33317V9.54405C21.7733 9.76664 21.922 9.9592 22.1284 10.0427C23.4626 10.5825 24.4 11.8782 24.4 13.3998C24.4 15.3998 22.7733 17.0265 20.7733 17.0265Z" fill={fill} />
  </svg>
);

const ToggleIcon = ({ fill = "white" }: { fill?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.48 5.14648H13.52C7.53329 5.14648 2.66663 10.0132 2.66663 15.9998C2.66663 21.9865 7.53329 26.8532 13.52 26.8532H18.48C24.4666 26.8532 29.3333 21.9865 29.3333 15.9998C29.3333 10.0132 24.4666 5.14648 18.48 5.14648ZM18.48 21.8932C15.2266 21.8932 12.5866 19.2532 12.5866 15.9998C12.5866 12.7465 15.2266 10.1065 18.48 10.1065C21.7333 10.1065 24.3733 12.7465 24.3733 15.9998C24.3733 19.2532 21.7333 21.8932 18.48 21.8932Z" fill={fill} />
  </svg>
);

const UserIcon = ({ fill = "white" }: { fill?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M26.0133 7.79984L18.0933 3.2265C16.8 2.47984 15.2 2.47984 13.8933 3.2265L5.98664 7.79984C4.69331 8.5465 3.89331 9.93317 3.89331 11.4398V20.5598C3.89331 22.0532 4.69331 23.4398 5.98664 24.1998L13.9066 28.7732C15.2 29.5198 16.8 29.5198 18.1066 28.7732L26.0266 24.1998C27.32 23.4532 28.12 22.0665 28.12 20.5598V11.4398C28.1066 9.93317 27.3066 8.55984 26.0133 7.79984ZM16 9.7865C17.72 9.7865 19.1066 11.1732 19.1066 12.8932C19.1066 14.6132 17.72 15.9998 16 15.9998C14.28 15.9998 12.8933 14.6132 12.8933 12.8932C12.8933 11.1865 14.28 9.7865 16 9.7865ZM19.5733 22.2132H12.4266C11.3466 22.2132 10.72 21.0132 11.32 20.1198C12.2266 18.7732 13.9866 17.8665 16 17.8665C18.0133 17.8665 19.7733 18.7732 20.68 20.1198C21.28 20.9998 20.64 22.2132 19.5733 22.2132Z" fill={fill} />
  </svg>
);

type ButtonProps = {
  children: React.ReactNode;
  active?: boolean;
};

function Button({ children, active }: ButtonProps) {
  const bgClass = active
    ? 'bg-gradient-to-b from-[rgba(255,168.80,56.07,0.25)] to-[rgba(255,169,56,0)]'
    : 'bg-gradient-to-b from-[rgba(255,255,255,0.25)] to-[rgba(255,255,255,0)]';

  return (
    <div className={`p-[12px] shadow-[0px_1px_2px_rgba(255,255,255,0.15)_inset] rounded-[40px] backdrop-blur-[25px] flex justify-start items-center gap-[10px] ${bgClass}`}>
      {children}
    </div>
  );
}

export default function Page() {
  const [isAndroid, setIsAndroid] = React.useState(false);

  React.useEffect(() => {
    // Detect Android platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice);
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden flex flex-col justify-center items-start">
      {/* Fixed Background Color */}
      <div className="fixed inset-0 bg-[#100024] z-0" />

      {/* Background Image - Fixed */}
      <div className="fixed inset-0 z-[1]">
        <img className="w-full h-full object-cover" src={imgBgAvatar} alt="" />
      </div>

      {/* Bottom Gradient Shadow - Fixed */}
      <div className="fixed bottom-0 left-0 w-full h-[200px] bg-gradient-to-t from-[#100024] to-transparent z-[2]" />

      {/* Status Bar Placeholder - Hidden on Android, Visible on iOS */}
      {!isAndroid && (
        <div className="w-full h-[44px] bg-transparent z-20 shrink-0" />
      )}

      {/* Telegram UI Placeholder - Visible on both */}
      <div className="w-full h-[46px] bg-transparent z-20 shrink-0" />

      {/* Extra spacing for Android */}
      {isAndroid && <div className="w-full h-[12px] bg-transparent z-20 shrink-0" />}

      {/* Main Content Area - Safe Area Container */}
      <div className={`w-full flex-1 pt-4 pl-4 pr-4 ${isAndroid ? 'pb-[46px]' : 'pb-[34px]'} flex flex-col justify-between items-center z-20 tg-content-safe-area-inset`}>
        {/* Top Row */}
        <div className="w-full flex justify-between items-center">
          <Button>
            <BroomIcon />
          </Button>
          <Button>
            <FlashIcon />
          </Button>
        </div>

        {/* Bottom Row */}
        <div className="w-full flex justify-between items-center">
          <Button active>
            <HomeIcon />
          </Button>
          <Button>
            <ToggleIcon />
          </Button>
          <Button>
            <SettingIcon />
          </Button>
          <Button>
            <UserIcon />
          </Button>
        </div>
      </div>

    </div>
  );
}
