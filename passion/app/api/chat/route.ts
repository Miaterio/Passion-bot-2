import { generateAIResponse, getUserSession, saveUserSession, bot } from "../../../src/lib/bot/bot";
import { AVATARS } from "../../../src/lib/bot/prompts";
import { NextResponse } from "next/server";

function getUserIdFromInitData(initData: string | null): number {
    if (!initData) return 0;
    try {
        const urlParams = new URLSearchParams(initData);
        const userParam = urlParams.get("user");
        if (userParam) {
            const user = JSON.parse(userParam);
            return user.id;
        }
    } catch (e) {
        console.error("Error parsing initData:", e);
    }
    return 0;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const initData = req.headers.get("X-Telegram-Init-Data") || searchParams.get("initData");

    let userId = getUserIdFromInitData(initData);

    // Fallback for local dev
    if (userId === 0 && process.env.NODE_ENV === "development") {
        userId = 12345;
    }

    if (userId === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getUserSession(userId);
    return NextResponse.json({
        messages: session.messages || [],
        avatarId: session.avatar?.id
    });
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const initData = req.headers.get("X-Telegram-Init-Data") || searchParams.get("initData");

    let userId = getUserIdFromInitData(initData);

    // Fallback for local dev
    if (userId === 0 && process.env.NODE_ENV === "development") {
        userId = 12345;
    }

    if (userId === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getUserSession(userId);

    // Delete messages from Telegram chat
    const messagesToDelete = [
        ...(session.botMessages || []),
        ...(session.userMessages || [])
    ];

    if (messagesToDelete.length > 0) {
        // We need to initialize bot if not already (it might be from the other route, but here we import it)
        // In Next.js, imports are cached, but let's be safe.
        // Actually, bot.api doesn't need init() for simple API calls usually, but handleUpdate does.
        // Let's try calling deleteMessage directly.

        await Promise.all(messagesToDelete.map(async (msgId) => {
            try {
                await bot.api.deleteMessage(userId, msgId);
            } catch (e) {
                console.warn(`Failed to delete message ${msgId}:`, e);
            }
        }));
    }

    session.messages = [];
    session.botMessages = [];
    session.userMessages = [];
    await saveUserSession(userId, session);

    return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, avatarId, initData } = body;

        if (!message || !avatarId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let userId = getUserIdFromInitData(initData);

        // Fallback for local dev
        if (userId === 0 && process.env.NODE_ENV === "development") {
            userId = 12345;
        }

        if (userId === 0) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const avatar = AVATARS.find((a) => a.id === avatarId);
        if (!avatar) {
            return NextResponse.json({ error: "Invalid avatar ID" }, { status: 400 });
        }

        // Load session from server storage
        const session = await getUserSession(userId);

        // Update session with current avatar if needed
        if (!session.avatar || session.avatar.id !== avatar.id) {
            session.avatar = avatar;
        }

        // Append user message
        session.messages.push({ role: "user", content: message });
        if (!session.userMessages) session.userMessages = [];

        const response = await generateAIResponse(userId, message, avatar.prompt, session.messages);

        // Append bot response
        session.messages.push({ role: "assistant", content: response });

        // Save session
        await saveUserSession(userId, session);

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
