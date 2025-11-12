// Type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        version?: string;
        platform?: string;
        ready?: () => void;
        expand?: () => void;
        setHeaderColor?: (color: string) => void;
        disableVerticalSwipes?: () => void;
        [key: string]: any;
      };
    };
  }
}

export {};
