import { Bot, InlineKeyboard, type Context } from "grammy";
import { prisma } from "@/lib/prisma";
import { analyzeText, analyzeImage, type MealAnalysis } from "@/lib/gemini";

let _bot: Bot | null = null;
let _initPromise: Promise<void> | null = null;

// Ленивое создание — чтобы `next build` (импорт роутов) не падал без токена.
export function getBot(): Bot {
  if (_bot) return _bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const bot = new Bot(token);
  registerHandlers(bot);
  _bot = bot;
  return bot;
}

// grammY требует bot.init() (botInfo) до обработки апдейтов. Мемоизируем.
export function ensureInit(): Promise<void> {
  if (!_initPromise) _initPromise = getBot().init();
  return _initPromise;
}

const round = (n: number) => Math.round(n);

function parseGrams(text: string): number | null {
  const m = text.replace(",", ".").match(/\d+(\.\d+)?/);
  if (!m) return null;
  const g = Math.round(parseFloat(m[0]));
  return g > 0 ? g : null;
}

function summaryText(p: {
  description: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}): string {
  return `Записать: ${p.description} (${p.calories} ккал, Б:${p.protein} Ж:${p.fat} У:${p.carbs})?`;
}

async function sendSummary(
  ctx: Context,
  pendingId: number,
  p: {
    description: string;
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  },
): Promise<void> {
  const kb = new InlineKeyboard()
    .text("✅ Да", `confirm:${pendingId}`)
    .text("✏️ Изменить", `edit:${pendingId}`);
  await ctx.reply(summaryText(p), { reply_markup: kb });
}

async function downloadFileBytes(filePath: string): Promise<Uint8Array> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const res = await fetch(
    `https://api.telegram.org/file/bot${token}/${filePath}`,
  );
  if (!res.ok) throw new Error("Не удалось скачать файл из Telegram");
  return new Uint8Array(await res.arrayBuffer());
}

// Профиль обязателен (FK на User). Если нет — просим открыть приложение.
async function requireUser(ctx: Context): Promise<bigint | null> {
  const tgId = ctx.from?.id;
  if (!tgId) return null;
  const userId = BigInt(tgId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const kb =
      appUrl?.startsWith("https://")
        ? new InlineKeyboard().webApp("Открыть приложение", appUrl)
        : undefined;
    await ctx.reply(
      "Сначала заполни профиль в приложении, чтобы я считал твою норму КБЖУ.",
      { reply_markup: kb },
    );
    return null;
  }
  return userId;
}

async function createConfirmation(
  ctx: Context,
  userId: bigint,
  a: MealAnalysis,
  imageUrl: string | null,
): Promise<void> {
  const pending = await prisma.pendingMeal.create({
    data: {
      userId,
      description: a.dish,
      detectedDish: a.dish,
      calories: round(a.calories),
      protein: round(a.protein),
      fat: round(a.fat),
      carbs: round(a.carbs),
      imageUrl,
      status: "awaitingConfirmation",
    },
  });
  await sendSummary(ctx, pending.id, pending);
}

function registerHandlers(bot: Bot): void {
  bot.command("start", async (ctx) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const kb =
      appUrl?.startsWith("https://")
        ? new InlineKeyboard().webApp("📊 Открыть приложение", appUrl)
        : undefined;
    await ctx.reply(
      "Привет! Я помогу считать КБЖУ.\n\n" +
        "• Напиши, что съел (напр. «Гречка 150г, куриная грудка 200г»)\n" +
        "• Или пришли фото еды\n\n" +
        "Прогресс за день — в приложении.",
      { reply_markup: kb },
    );
  });

  bot.on("message:text", async (ctx) => {
    const userId = await requireUser(ctx);
    if (!userId) return;

    // Если ждём граммовку — трактуем текст как вес и пересчитываем.
    const awaiting = await prisma.pendingMeal.findFirst({
      where: { userId, status: "awaitingGrams" },
      orderBy: { createdAt: "desc" },
    });
    if (awaiting) {
      const grams = parseGrams(ctx.message.text);
      if (!grams) {
        await ctx.reply("Не понял вес. Напиши число граммов, например: 250");
        return;
      }
      const dish = awaiting.detectedDish ?? awaiting.description;
      await ctx.replyWithChatAction("typing");
      const a = await analyzeText(`${dish}, ${grams} г`);
      const updated = await prisma.pendingMeal.update({
        where: { id: awaiting.id },
        data: {
          description: a.dish,
          calories: round(a.calories),
          protein: round(a.protein),
          fat: round(a.fat),
          carbs: round(a.carbs),
          status: "awaitingConfirmation",
        },
      });
      await sendSummary(ctx, updated.id, updated);
      return;
    }

    // Новый приём пищи из текста.
    await ctx.replyWithChatAction("typing");
    const a = await analyzeText(ctx.message.text);
    if (a.needs_clarification) {
      await ctx.reply(
        "Не смог разобрать. Уточни блюдо и вес, например: «Овсянка 60г на воде».",
      );
      return;
    }
    await createConfirmation(ctx, userId, a, null);
  });

  bot.on("message:photo", async (ctx) => {
    const userId = await requireUser(ctx);
    if (!userId) return;

    await ctx.replyWithChatAction("typing");
    const file = await ctx.getFile();
    if (!file.file_path) {
      await ctx.reply("Не удалось получить фото, попробуй ещё раз.");
      return;
    }
    const bytes = await downloadFileBytes(file.file_path);
    const a = await analyzeImage(bytes, "image/jpeg");

    if (a.needs_clarification) {
      await prisma.pendingMeal.create({
        data: {
          userId,
          description: a.dish,
          detectedDish: a.dish,
          status: "awaitingGrams",
        },
      });
      await ctx.reply(
        `Вижу на фото «${a.dish}», но не могу определить размер порции. Сколько здесь грамм?`,
      );
      return;
    }
    await createConfirmation(ctx, userId, a, null);
  });

  bot.callbackQuery(/^confirm:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[1]);
    const p = await prisma.pendingMeal.findUnique({ where: { id } });
    if (
      !p ||
      !ctx.from?.id || p.userId !== BigInt(ctx.from.id) ||
      p.status !== "awaitingConfirmation" ||
      p.calories === null ||
      p.protein === null ||
      p.fat === null ||
      p.carbs === null
    ) {
      await ctx.answerCallbackQuery("Запись не найдена");
      return;
    }
    await prisma.meal.create({
      data: {
        userId: p.userId,
        description: p.description,
        calories: p.calories,
        protein: p.protein,
        fat: p.fat,
        carbs: p.carbs,
        imageUrl: p.imageUrl,
      },
    });
    await prisma.pendingMeal.delete({ where: { id } });
    await ctx.editMessageText(
      `✅ Записано: ${p.description} (${p.calories} ккал, Б:${p.protein} Ж:${p.fat} У:${p.carbs})`,
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^edit:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match[1]);
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.answerCallbackQuery("Запись не найдена");
      return;
    }
    const p = await prisma.pendingMeal
      .update({ where: { id, userId: BigInt(userId) }, data: { status: "awaitingGrams" } })
      .catch(() => null);
    if (!p) {
      await ctx.answerCallbackQuery("Запись не найдена");
      return;
    }
    await ctx.editMessageText(
      `Сколько грамм в «${p.detectedDish ?? p.description}»? Напиши число.`,
    );
    await ctx.answerCallbackQuery();
  });

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });
}
