import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/telegram-auth";

export const runtime = "nodejs";

const createSchema = z.object({
  description: z.string().trim().min(1).max(200),
  calories: z.number().int().min(0).max(10000),
  protein: z.number().int().min(0).max(2000),
  fat: z.number().int().min(0).max(2000),
  carbs: z.number().int().min(0).max(2000),
});

// Ручное добавление приёма пищи (название + КБЖУ, без ИИ).
export async function POST(req: Request): Promise<Response> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  const meal = await prisma.meal.create({
    data: { userId, ...parsed.data },
    select: {
      id: true,
      description: true,
      calories: true,
      protein: true,
      fat: true,
      carbs: true,
      createdAt: true,
    },
  });
  return Response.json({ meal });
}

// Приёмы пищи за сегодня (с начала текущих суток по времени сервера).
export async function GET(req: Request): Promise<Response> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const meals = await prisma.meal.findMany({
    where: { userId, createdAt: { gte: start } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      description: true,
      calories: true,
      protein: true,
      fat: true,
      carbs: true,
      createdAt: true,
    },
  });

  return Response.json({ meals });
}
