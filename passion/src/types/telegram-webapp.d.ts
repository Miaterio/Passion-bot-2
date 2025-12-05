// Type definitions for Telegram WebApp
// Based on https://core.telegram.org/bots/webapps

interface TelegramWebApp {
    onEvent(eventType: 'viewportChanged' | 'themeChanged' | 'mainButtonClicked' | 'backButtonClicked', callback: () => void): void;
    offEvent(eventType: 'viewportChanged' | 'themeChanged' | 'mainButtonClicked' | 'backButtonClicked', callback: () => void): void;
    showPopup(params: { title?: string; message: string; buttons?: Array<{ id?: string; type: string; text?: string }> }): void;
    showAlert(message: string): void;
    showConfirm(message: string): void;
    showScanQrPopup(params: { text?: string }, callback?: (text: string) => boolean | void): void;
    closeScanQrPopup(): void;
    readTextFromClipboard(callback?: (text: string) => void): void;
    requestWriteAccess(callback?: (access: boolean) => void): void;
    requestContact(callback?: (contact: boolean) => void): void;
    ready(): void;
    expand(): void;
    close(): void;
    enableClosingConfirmation(): void;
    disableClosingConfirmation(): void;
    isClosingConfirmationEnabled: boolean;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    isVersionAtLeast(version: string): boolean;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
        secondary_bg_color?: string;
    };
    initData: string;
    initDataUnsafe: {
        query_id?: string;
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
        };
        receiver?: any;
        chat?: any;
        start_param?: string;
        auth_date?: number;
        hash?: string;
    };
    version: string;
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        isProgressVisible: boolean;
        setText(text: string): void;
        onClick(callback: () => void): void;
        offClick(callback: () => void): void;
        show(): void;
        hide(): void;
        enable(): void;
        disable(): void;
        showProgress(leaveActive?: boolean): void;
        hideProgress(): void;
        setParams(params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }): void;
    };
    BackButton: {
        isVisible: boolean;
        onClick(callback: () => void): void;
        offClick(callback: () => void): void;
        show(): void;
        hide(): void;
    };
    HapticFeedback: {
        impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
        notificationOccurred(type: 'error' | 'success' | 'warning'): void;
        selectionChanged(): void;
    };
}

interface Window {
    Telegram?: {
        WebApp: TelegramWebApp;
    };
}
