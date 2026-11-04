import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/telegram-auth";
import { calcTargets } from "@/lib/nutrition";

export const runtime = "nodejs";

const schema = z.object({
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(10).max(120),
  height: z.number().int().min(100).max(250),
  weight: z.number().min(30).max(400),
  targetWeight: z.number().min(30).max(400).optional(),
  goal: z.enum(["lose", "maintain", "gain"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "high", "veryHigh"]),
});

export async function POST(req: Request): Promise<Response> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }
  const p = parsed.data;
  const t = calcTargets(p);

  const data = {
    gender: p.gender,
    age: p.age,
    height: p.height,
    weight: p.weight,
    targetWeight: p.targetWeight ?? null,
    goal: p.goal,
    activityLevel: p.activityLevel,
    dailyCalories: t.calories,
    dailyProtein: t.protein,
    dailyFat: t.fat,
    dailyCarbs: t.carbs,
  };

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, ...data },
    update: data,
  });

  return Response.json({ targets: t });
}
