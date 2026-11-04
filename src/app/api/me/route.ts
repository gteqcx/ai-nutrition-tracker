import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/telegram-auth";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return Response.json({ user: null });

  return Response.json({
    user: {
      gender: user.gender,
      age: user.age,
      height: user.height,
      weight: user.weight,
      targetWeight: user.targetWeight,
      goal: user.goal,
      activityLevel: user.activityLevel,
      targets: {
        calories: user.dailyCalories,
        protein: user.dailyProtein,
        fat: user.dailyFat,
        carbs: user.dailyCarbs,
      },
    },
  });
}
