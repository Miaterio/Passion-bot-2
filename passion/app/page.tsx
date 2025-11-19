'use client';

import React from 'react';
import { initData, miniApp, themeParams, viewport } from '@tma.js/sdk';
import { useSignal } from '@tma.js/sdk-react';

export default function Home() {
  const init = useSignal(initData.state);
  const theme = useSignal(themeParams.state);
  const vp = useSignal(viewport.state);
  const app = useSignal(miniApp.state);

  const user = init?.user;

  return (
    <div className="app-container" style={{
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--tg-theme-bg-color)',
      color: 'var(--tg-theme-text-color)',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--tg-theme-hint-color, #ccc)',
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: 'var(--tg-theme-text-color)',
          }}>
            Telegram Mini App
          </h1>
          <p style={{
            color: 'var(--tg-theme-hint-color)',
            fontSize: '14px',
          }}>
            Powered by @tma.js/sdk v3.1.0
          </p>
        </header>

        {/* User Info */}
        {user && (
          <section style={{
            background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'var(--tg-theme-text-color)',
            }}>
              👤 User Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <InfoRow label="First Name" value={user.first_name} />
              {user.last_name && <InfoRow label="Last Name" value={user.last_name} />}
              {user.username && <InfoRow label="Username" value={`@${user.username}`} />}
              <InfoRow label="User ID" value={user.id.toString()} />
              <InfoRow label="Language" value={user.language_code || 'N/A'} />
              <InfoRow label="Premium" value={user.is_premium ? '⭐ Yes' : 'No'} />
            </div>
          </section>
        )}

        {/* Theme Info */}
        {theme && (
          <section style={{
            background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'var(--tg-theme-text-color)',
            }}>
              🎨 Theme Colors
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ColorRow label="Background" color={theme.bg_color} />
              <ColorRow label="Text" color={theme.text_color} />
              <ColorRow label="Link" color={theme.link_color} />
              <ColorRow label="Button" color={theme.button_color} />
              <ColorRow label="Button Text" color={theme.button_text_color} />
            </div>
          </section>
        )}

        {/* Viewport Info */}
        {vp && (
          <section style={{
            background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'var(--tg-theme-text-color)',
            }}>
              📱 Viewport & Safe Area
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <InfoRow label="Width" value={`${vp.width}px`} />
              <InfoRow label="Height" value={`${vp.height}px`} />
              <InfoRow label="Stable Height" value={`${vp.stableHeight}px`} />
              <InfoRow label="Is Expanded" value={vp.isExpanded ? '✅ Yes' : '❌ No'} />
            </div>
          </section>
        )}

        {/* Content Safe Area */}
        <section style={{
          background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'var(--tg-theme-text-color)',
          }}>
            🛡️ Content Safe Area (Full Size Mode)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <InfoRow label="Top Inset" value={`var(--tg-content-safe-area-inset-top)`} />
            <InfoRow label="Bottom Inset" value={`var(--tg-content-safe-area-inset-bottom)`} />
            <InfoRow label="Left Inset" value={`var(--tg-content-safe-area-inset-left)`} />
            <InfoRow label="Right Inset" value={`var(--tg-content-safe-area-inset-right)`} />
          </div>
        </section>

        {/* SDK Version */}
        <section style={{
          background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
          padding: '16px',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <p style={{
            color: 'var(--tg-theme-hint-color)',
            fontSize: '14px',
          }}>
            🚀 Telegram Mini App is running!
          </p>
          <p style={{
            color: 'var(--tg-theme-hint-color)',
            fontSize: '12px',
            marginTop: '8px',
          }}>
            SDK initialized with full size mode & safe area support
          </p>
        </section>
      </div>

      {/* Debug: Content Safe Area Overlays (all 4 sides) */}
      <div className="debug-safe-area-top" />
      <div className="debug-safe-area-bottom" />
      <div className="debug-safe-area-left" />
      <div className="debug-safe-area-right" />
      <DebugSafeAreaInfo />
    </div>
  );
}

// Debug Component - Shows safe area values in real-time
function DebugSafeAreaInfo() {
  if (typeof window === 'undefined') return null;

  const [safeArea, setSafeArea] = React.useState({
    top: '0px',
    bottom: '0px',
    left: '0px',
    right: '0px',
  });

  React.useEffect(() => {
    const updateSafeArea = () => {
      const root = document.documentElement;
      setSafeArea({
        top: getComputedStyle(root).getPropertyValue('--tg-content-safe-area-inset-top') || '0px',
        bottom: getComputedStyle(root).getPropertyValue('--tg-content-safe-area-inset-bottom') || '0px',
        left: getComputedStyle(root).getPropertyValue('--tg-content-safe-area-inset-left') || '0px',
        right: getComputedStyle(root).getPropertyValue('--tg-content-safe-area-inset-right') || '0px',
      });
    };

    updateSafeArea();
    const interval = setInterval(updateSafeArea, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="debug-safe-area-info">
      <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff0' }}>
        📐 Content Safe Area
      </div>
      <div>Top: {safeArea.top}</div>
      <div>Bottom: {safeArea.bottom}</div>
      <div>Left: {safeArea.left}</div>
      <div>Right: {safeArea.right}</div>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
      <span style={{ color: 'var(--tg-theme-hint-color)' }}>{label}:</span>
      <span style={{ color: 'var(--tg-theme-text-color)', fontWeight: '500' }}>{value}</span>
    </div>
  );
}

function ColorRow({ label, color }: { label: string; color?: string }) {
  if (!color) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
      <span style={{ color: 'var(--tg-theme-hint-color)' }}>{label}:</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          background: color,
          border: '1px solid var(--tg-theme-hint-color)',
        }} />
        <span style={{ color: 'var(--tg-theme-text-color)', fontWeight: '500', fontFamily: 'monospace' }}>
          {color}
        </span>
      </div>
    </div>
  );
}
