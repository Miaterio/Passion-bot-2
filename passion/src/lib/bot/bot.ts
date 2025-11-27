import { Bot, Context, session, SessionFlavor } from "grammy";
import { FileAdapter } from "@grammyjs/storage-file";
import { AVATARS, Avatar } from "./prompts";
import path from "path";
import fs from "fs/promises";

// Define Session Interface
interface SessionData {
    avatar: Avatar | null;
    ageConfirmed: boolean;
    messages: { role: string; content: string }[];
    botMessages: number[];
    userMessages: number[];
}

type MyContext = Context & SessionFlavor<SessionData>;

// Environment Variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is not defined");
}

export const bot = new Bot<MyContext>(BOT_TOKEN);

// Session Storage (File-based for local dev)
const sessionDir = path.join(process.cwd(), "sessions");
const sessionStorage = new FileAdapter({ dir: sessionDir });

bot.use(
    session({
        initial: () => ({
            avatar: null,
            ageConfirmed: false,
            messages: [],
            botMessages: [],
            userMessages: [],
        }),
        storage: sessionStorage,
    })
);

// --- Helper Functions ---

async function showAvatarSelection(ctx: MyContext) {
    let text = "Выбери своего собеседника:\n\n";
    const keyboard = AVATARS.map((avatar) => [
        { text: avatar.name, callback_data: `select_${avatar.id}` },
    ]);

    const sentMessage = await ctx.reply(text, {
        reply_markup: { inline_keyboard: keyboard },
    });

    if (!ctx.session.botMessages) ctx.session.botMessages = [];
    ctx.session.botMessages.push(sentMessage.message_id);
}

export async function generateAIResponse(
    userId: number,
    userMessage: string,
    avatarPrompt: string,
    sessionMessages: { role: string; content: string }[]
) {
    const messages = [
        {
            role: "system",
            content: `${avatarPrompt}\n\n🔥 ВАЖНО: Каждое твоё сообщение должно быть разбито на части... (см. оригинальный промпт)`, // Shortened for brevity in code, but should be full
        },
        ...sessionMessages,
        { role: "user", content: userMessage },
    ];

    // Re-injecting the full system prompt logic from original bot.js to ensure behavior match
    messages[0].content = `${avatarPrompt}

🔥 ВАЖНО: Каждое твоё сообщение должно быть разбито на части. Каждая часть — отдельная мысль, законченная фраза. Между частями — ДВОЙНОЙ ПЕРЕНОС СТРОКИ (\n\n). Максимальная длина одной части - 400 символов (с учетом пробелов).

Пример:
Привет, милый... Я так по тебе скучала.\n\n
Ты не представляешь, о чём я сегодня мечтала...\n\n
Давай поиграем? Я приготовила кое-что для тебя... 😉\n\n

НИКОГДА не пиши длинные монологи. Имитируй живого человека, который печатает сообщения по одному. Отвечай в пределах 2000 символов, эмоционально, с деталями.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "Passion Bot",
        },
        body: JSON.stringify({
            model: "x-ai/grok-4.1-fast:free",
            messages: messages,
            max_tokens: 512,
            temperature: 0.9,
        }),
    });

    const data = await response.json();

    if (data.error) {
        console.error("❌ OpenRouter Error:", data.error);
        if (data.error.code === 429) throw new Error("RATE_LIMIT");
        throw new Error("OpenRouter error: " + data.error.message);
    }

    if (!data.choices || !data.choices[0]) {
        throw new Error("No response from AI model");
    }

    return data.choices[0].message.content;
}

function splitMessage(text: string) {
    const parts = text.split(/\n\s*\n/g).filter((part) => part.trim().length > 0);
    const finalParts = [];
    const MAX_PART_LENGTH = 600;
    for (const part of parts) {
        if (part.length > MAX_PART_LENGTH) {
            const words = part.split(" ");
            let currentChunk = "";
            for (const word of words) {
                if ((currentChunk + word).length > MAX_PART_LENGTH && currentChunk) {
                    finalParts.push(currentChunk.trim());
                    currentChunk = word + " ";
                } else {
                    currentChunk += word + " ";
                }
            }
            if (currentChunk.trim()) finalParts.push(currentChunk.trim());
        } else {
            finalParts.push(part.trim());
        }
    }
    return finalParts;
}

// --- Command Handlers ---

bot.command("start", async (ctx: MyContext) => {
    if (ctx.session.ageConfirmed && ctx.session.avatar) {
        await ctx.reply(`🎉 С возвращением! Ваш собеседник: ${ctx.session.avatar.name}`);
        return;
    }

    if (ctx.session.ageConfirmed) {
        await showAvatarSelection(ctx);
        return;
    }

    const sentMessage = await ctx.reply(
        "🔞 Добро пожаловать в Passion Bot. Этот бот предназначен только для пользователей 18+.\n\nВам есть 18 лет?",
        {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Да, мне 18+", callback_data: "age_ok" }],
                    [{ text: "❌ Нет", callback_data: "age_no" }],
                ],
            },
        }
    );

    if (!ctx.session.botMessages) ctx.session.botMessages = [];
    ctx.session.botMessages.push(sentMessage.message_id);
});

bot.callbackQuery("age_ok", async (ctx) => {
    ctx.session.ageConfirmed = true;
    await ctx.editMessageText("✅ Отлично. Теперь выбери персонажа:");
    await showAvatarSelection(ctx);
});

bot.callbackQuery("age_no", async (ctx) => {
    await ctx.editMessageText("❌ Этот бот доступен только для взрослых.");
});

bot.callbackQuery(/^select_(.+)$/, async (ctx) => {
    const avatarId = ctx.match[1];
    const avatar = AVATARS.find((a) => a.id === avatarId);

    if (avatar) {
        ctx.session.avatar = avatar;
        await ctx.editMessageText(
            `✅ Выбран персонаж: ${avatar.name}\n\nТеперь можешь писать мне что угодно 😉`
        );
    }
});

bot.command("clear", async (ctx) => {
    ctx.session.messages = [];
    ctx.session.botMessages = [];
    ctx.session.userMessages = [];
    await ctx.reply("🗑️ История очищена!");
});

bot.on("message:text", async (ctx) => {
    const userMessage = ctx.message.text;

    if (!ctx.session.ageConfirmed) {
        // Re-trigger age check if somehow bypassed or session lost
        await ctx.reply("🔞 Подтвердите возраст /start");
        return;
    }

    if (!ctx.session.avatar) {
        await ctx.reply("Сначала выбери персонажа командой /start");
        return;
    }

    if (!ctx.session.userMessages) ctx.session.userMessages = [];
    ctx.session.userMessages.push(ctx.message.message_id);
    ctx.session.messages.push({ role: "user", content: userMessage });

    try {
        await ctx.replyWithChatAction("typing");
        const aiResponse = await generateAIResponse(
            ctx.from.id,
            userMessage,
            ctx.session.avatar.prompt,
            ctx.session.messages
        );

        ctx.session.messages.push({ role: "assistant", content: aiResponse });
        const parts = splitMessage(aiResponse);

        for (let i = 0; i < parts.length; i++) {
            if (i > 0) {
                await ctx.replyWithChatAction("typing");
                await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
            }
            const sent = await ctx.reply(parts[i]);
            if (!ctx.session.botMessages) ctx.session.botMessages = [];
            ctx.session.botMessages.push(sent.message_id);
        }
    } catch (error: any) {
        console.error("Error:", error);
        await ctx.reply("😔 Ошибка: " + error.message);
    }
});
