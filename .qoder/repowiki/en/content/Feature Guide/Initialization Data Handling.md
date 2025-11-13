# Initialization Data Handling

<cite>
**Referenced Files in This Document**   
- [page.tsx](file://passion/src/app/init-data/page.tsx) - *Updated to use new initData signal structure*
- [DisplayData.tsx](file://passion/src/components/DisplayData/DisplayData.tsx)
- [mockEnv.ts](file://passion/src/mockEnv.ts)
</cite>

## Update Summary
**Changes Made**   
- Updated documentation to reflect refactoring of init-data page to use new initData signal structure from @tma.js/sdk-react
- Revised Accessing Initialization Data section to show direct property access via useSignal
- Updated Structure of Initialization Data with current property names
- Modified Data Transformation section to reflect updated useMemo dependencies
- Enhanced code examples with current implementation details
- Added specific line references to updated sections

## Table of Contents
1. [Introduction](#introduction)
2. [Accessing Initialization Data Using SDK Hooks](#accessing-initialization-data-using-sdk-hooks)
3. [Structure of Initialization Data](#structure-of-initialization-data)
4. [Data Transformation with useMemo](#data-transformation-with-usememo)
5. [Conditional Rendering and Fallback UI](#conditional-rendering-and-fallback-ui)
6. [Mocking Initialization Data in Development](#mocking-initialization-data-in-development)
7. [Best Practices for Secure Data Handling](#best-practices-for-secure-data-handling)
8. [Common Challenges and Debugging Tips](#common-challenges-and-debugging-tips)

## Introduction
The Initialization Data Handling feature in Telegram Mini Apps enables developers to securely access user authentication data, chat context, and receiver information provided by the Telegram platform upon app launch. This document details how the `@tma.js/sdk-react` hooks are used to retrieve and process this data, transform it into display-ready formats, and handle edge cases such as missing or malformed initialization data. It also covers development practices for mocking data and ensuring secure handling of sensitive user information.

**Section sources**
- [page.tsx](file://passion/src/app/init-data/page.tsx#L1-L90)

## Accessing Initialization Data Using SDK Hooks
Initialization data is accessed using the `useSignal` hook from `@tma.js/sdk-react`, which subscribes to reactive signals provided by the SDK. The `initData` object provides direct access to parsed properties including user, receiver, chat, authDate, hash, queryId, and startParam. These signals are consumed in the `InitDataPage` component to enable real-time updates when the data changes.

The implementation now directly accesses properties from the `initData` object rather than using separate signals for raw and state data:

```typescript
const initDataRaw = useSignal(initData.raw);
const user = useSignal(initData.user);
const receiver = useSignal(initData.receiver);
const chat = useSignal(initData.chat);
const authDate = useSignal(initData.authDate);
const hash = useSignal(initData.hash);
const queryId = useSignal(initData.queryId);
const startParam = useSignal(initData.startParam);
```

This approach simplifies access to initialization data properties and ensures consistent typing through the SDK's type definitions.

```mermaid
sequenceDiagram
participant Component as InitDataPage
participant Hook as useSignal
participant SDK as @tma.js/sdk-react
Component->>Hook : useSignal(initData.user)
Component->>Hook : useSignal(initData.chat)
Component->>Hook : useSignal(initData.authDate)
Hook->>SDK : Subscribe to specific initData properties
SDK-->>Hook : Emit property values
Hook-->>Component : Return current values
```

**Section sources**
- [page.tsx](file://passion/src/app/init-data/page.tsx#L23-L31)

## Structure of Initialization Data
Initialization data includes several key components passed from Telegram:
- **User Profile**: Contains user identifiers such as `id`, `first_name`, `last_name`, `username`, `photo_url`, and `language_code`.
- **Receiver Information**: Represents another user involved in the interaction (e.g., in a chat), with the same structure as the user object.
- **Chat Context**: Includes chat-specific details like `id`, `type`, `title`, and `photo_url`.
- **Authentication Parameters**: Critical security fields including `auth_date` (timestamp), `hash` (cryptographic signature), `query_id`, and `start_param`.

These parameters are essential for verifying the authenticity of the data on the server side and must be preserved in their original order during validation.

**Section sources**
- [page.tsx](file://passion/src/app/init-data/page.tsx#L24-L28)

## Data Transformation with useMemo
The raw initialization data is transformed into display-ready rows using React's `useMemo` hook to optimize performance. Four primary transformations occur:
- `initDataRows`: Maps top-level init data fields (excluding nested objects) into key-value pairs, converting dates to ISO strings.
- `userRows`: Extracts user profile properties into a list of displayable items.
- `receiverRows`: Similarly processes receiver data if present.
- `chatRows`: Transforms chat context into a structured format for rendering.

Each transformation is memoized based on dependencies (`initDataRaw`, `authDate`, `hash`, `queryId`, `startParam`, `user`, `receiver`, `chat`) to prevent unnecessary recalculations.

```mermaid
flowchart TD
Start([Raw Init Data]) --> Parse["Parse initData properties"]
Parse --> TransformUser["Transform User: getUserRows()"]
Parse --> TransformReceiver["Transform Receiver: getUserRows()"]
Parse --> TransformChat["Transform Chat: Object.entries()"]
Parse --> TransformInit["Transform Init: reduce entries"]
TransformUser --> OutputUser["DisplayDataRow[]"]
TransformReceiver --> OutputReceiver["DisplayDataRow[]"]
TransformChat --> OutputChat["DisplayDataRow[]"]
TransformInit --> OutputInit["DisplayDataRow[]"]
```

**Section sources**
- [page.tsx](file://passion/src/app/init-data/page.tsx#L32-L60)

## Conditional Rendering and Fallback UI
The application conditionally renders data sections only when corresponding values are available. If `initDataRows` is undefined (indicating missing init data), a fallback `Placeholder` UI is displayed with an illustrative image and error message. Otherwise, the `DisplayData` component is rendered for each available dataset: init data, user, receiver, and chat.

This ensures a graceful user experience even when required data is absent, preventing crashes or undefined behavior.

```mermaid
flowchart TD
A[Check initDataRows] --> B{initDataRows exists?}
B --> |No| C[Render Placeholder UI]
B --> |Yes| D[Render List]
D --> E[Display Init Data]
D --> F{User exists?}
F --> |Yes| G[Display User Data]
F --> |No| H[Skip]
D --> I{Receiver exists?}
I --> |Yes| J[Display Receiver Data]
I --> |No| K[Skip]
D --> L{Chat exists?}
L --> |Yes| M[Display Chat Data]
L --> |No| N[Skip]
```

**Section sources**
- [page.tsx](file://passion/src/app/init-data/page.tsx#L61-L88)

## Mocking Initialization Data in Development
During development, the `mockEnv.ts` file enables simulation of Telegram environment when running outside the app. The `mockEnv()` function checks if the environment is non-Telegram and injects mock launch parameters, including a sample `tgWebAppData` containing `auth_date`, `hash`, and a mock `user` object. This allows developers to test UI components without deploying to Telegram.

It is crucial to ensure mock data closely resembles real init data structure to avoid parsing issues during production.

```mermaid
sequenceDiagram
participant App as Application
participant Mock as mockEnv()
participant SDK as @tma.js/sdk-react
App->>Mock : mockEnv()
Mock->>SDK : isTMA('complete')
SDK-->>Mock : false
Mock->>Mock : Create mock launchParams
Mock->>SDK : mockTelegramEnv(launchParams)
SDK-->>App : Simulate Telegram environment
```

**Section sources**
- [mockEnv.ts](file://passion/src/mockEnv.ts#L5-L62)

## Best Practices for Secure Data Handling
To securely handle initialization data:
- **Never trust client-side data**: Always validate `hash` on the server using your bot token.
- **Preserve parameter order**: Do not sort or modify the raw init data string before validation.
- **Avoid logging sensitive data**: Prevent accidental exposure of `hash` or user identifiers.
- **Use HTTPS in production**: Ensure all communications are encrypted.
- **Validate data freshness**: Check `auth_date` to reject stale sessions.

Server-side verification is mandatory to prevent spoofing attacks.

**Section sources**
- [mockEnv.ts](file://passion/src/mockEnv.ts#L45-L50)

## Common Challenges and Debugging Tips
Developers often face these challenges:
- **Missing init data**: Caused by launching app outside Telegram. Use `mockEnv()` to simulate.
- **Malformed JSON in user/receiver fields**: Ensure proper URL decoding before parsing.
- **Hash validation failures**: Caused by reordering parameters or incorrect encoding. Use exact string from Telegram.
- **Type inconsistencies**: Some fields may be missing or have unexpected types; always check for `undefined`.

Use browser developer tools and enable debug mode in `init.ts` to trace signal updates and inspect state changes.

**Section sources**
- [page.tsx](file://passion/src/app/init-data/page.tsx#L23-L31)
- [mockEnv.ts](file://passion/src/mockEnv.ts#L5-L62)