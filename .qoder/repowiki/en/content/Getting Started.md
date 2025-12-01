# Getting Started

<cite>
**Referenced Files in This Document**   
- [README.md](file://passion/README.md)
- [package.json](file://passion/package.json)
- [mockEnv.ts](file://passion/src/mockEnv.ts)
- [instrumentation-client.ts](file://passion/src/instrumentation-client.ts)
</cite>

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Install Dependencies](#install-dependencies)
3. [Run in Development Mode](#run-in-development-mode)
4. [Run with HTTPS for Telegram Integration](#run-with-https-for-telegram-integration)
5. [Understanding Environment Mocking](#understanding-environment-mocking)
6. [Common Setup Issues](#common-setup-issues)

## Prerequisites

Before setting up the development environment, ensure you have completed the following prerequisites:

1. **Create a Telegram Bot**: Use [@BotFather](https://t.me/botfather) to create a new bot. Follow the [official guide](https://docs.telegram-mini-apps.com/platform/creating-new-app) for detailed instructions on bot creation and configuration.
2. **Install Node.js**: Ensure you have Node.js (version 16 or higher) installed on your system.
3. **Install pnpm**: This project requires pnpm as the package manager. Install it globally using:
   ```bash
   npm install -g pnpm
   ```

**Section sources**
- [README.md](file://passion/README.md#L45-L49)

## Install Dependencies

This project was created using [pnpm](https://pnpm.io/) and requires it for proper dependency management. Using other package managers (npm, yarn) will result in errors due to the presence of `pnpm-lock.yaml`.

To install project dependencies:

1. Navigate to the project root directory:
   ```bash
   cd passion
   ```

2. Install all dependencies using pnpm:
   ```bash
   pnpm install
   ```

The `package.json` file contains all required dependencies for the Telegram Mini App, including Next.js, TypeScript, TON Connect, and Telegram Apps SDK.

**Why pnpm is required**: The project uses pnpm's strict dependency resolution and disk space optimization features. The `pnpm-lock.yaml` file ensures consistent dependency versions across all development environments.

**Section sources**
- [README.md](file://passion/README.md#L12-L23)
- [package.json](file://passion/package.json#L1-L33)

## Run in Development Mode

After installing dependencies, start the application in development mode:

```bash
pnpm run dev
```

Upon successful startup, you'll see output similar to:
```
▲ Next.js 14.2.3
- Local:        http://localhost:3000

✓ Starting...
✓ Ready in 2.9s
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the application.

**Important notes**:
- Some libraries like `@tma.js/sdk` are designed to work within Telegram but will function properly in development mode.
- The application uses environment mocking via `mockEnv()` function to simulate the Telegram environment when running outside Telegram.
- This mocking behavior is only applied in development mode and is tree-shaken in production builds.

**Section sources**
- [README.md](file://passion/README.md#L58-L75)
- [instrumentation-client.ts](file://passion/src/instrumentation-client.ts#L1-L26)

## Run with HTTPS for Telegram Integration

To test the application within Telegram using @BotFather, you need an HTTPS link. The template provides a built-in solution using a self-signed SSL certificate.

1. Start the application with HTTPS:
   ```bash
   pnpm run dev:https
   ```

2. You'll see output indicating the HTTPS server is running:
   ```
   ▲ Next.js 14.2.3
   - Local:        https://localhost:3000
   
   ✓ Starting...
   ✓ Ready in 2.4s
   ```

3. **Browser SSL Warning**: When accessing `https://localhost:3000`, your browser will display a security warning about the self-signed certificate. This is normal and expected.

4. **Proceed Safely**: Click "Proceed to localhost (unsafe)" or your browser's equivalent option to continue. The site is safe for local development.

5. **Configure @BotFather**: Submit `https://127.0.0.1:3000` (not localhost) as your Mini App link to @BotFather. Note that `localhost` is considered invalid by BotFather.

6. Test your app by launching it through [web.telegram.org](https://web.telegram.org/k/) or the Telegram desktop/mobile app.

**Section sources**
- [README.md](file://passion/README.md#L98-L125)
- [package.json](file://passion/package.json#L7)

## Understanding Environment Mocking

The application includes automatic environment mocking to facilitate development outside Telegram:

- The `mockEnv()` function in `src/mockEnv.ts` simulates Telegram's environment when the app runs outside Telegram.
- This function is called in `instrumentation-client.ts` during application initialization.
- It provides mock data for theme parameters, viewport information, and launch parameters.
- The mocking only occurs in development mode (`process.env.NODE_ENV === 'development'`).
- In production builds, this code is tree-shaken and removed from the final bundle.

This allows you to develop and test the application's UI and functionality locally while ensuring it will only run properly within Telegram in production.

**Section sources**
- [mockEnv.ts](file://passion/src/mockEnv.ts#L1-L82)
- [instrumentation-client.ts](file://passion/src/instrumentation-client.ts#L8-L26)

## Common Setup Issues

### SSL Certificate Warnings
**Issue**: Browser displays "Your connection is not private" or similar SSL warnings.
**Solution**: This is expected with self-signed certificates. Click "Advanced" and then "Proceed to localhost (unsafe)". The certificate is only for local development and poses no security risk.

### pnpm Not Found
**Issue**: "command not found: pnpm" error.
**Solution**: Install pnpm globally:
```bash
npm install -g pnpm
```

### Port 3000 Already in Use
**Issue**: "Port 3000 is already in use" error.
**Solution**: Stop the conflicting process or modify the script in `package.json` to use a different port:
```json
"dev": "next dev -p 3001"
```

### Application Crashes Outside Telegram
**Issue**: The application may crash when accessed directly in a browser after building for production.
**Solution**: This is expected behavior. The application is designed to run within Telegram. Use the development mode with environment mocking for local testing.