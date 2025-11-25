import { generateAIResponse } from "../../../src/lib/bot/bot";
import { AVATARS } from "../../../src/lib/bot/prompts";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, history, avatarId } = body;

        if (!message || !avatarId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const avatar = AVATARS.find((a) => a.id === avatarId);
        if (!avatar) {
            return NextResponse.json({ error: "Invalid avatar ID" }, { status: 400 });
        }

        // We use a dummy userId (0) or extract it from initData if we validate it.
        // For now, assuming the client sends valid data.
        // In a real app, we MUST validate Telegram WebApp InitData to get the real userId.
        const userId = 0;

        const response = await generateAIResponse(userId, message, avatar.prompt, history || []);

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
