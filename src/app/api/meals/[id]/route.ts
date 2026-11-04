import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/telegram-auth";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "invalid_id" }, { status: 400 });
  }

  // deleteMany со scope по userId — нельзя удалить чужую запись.
  const res = await prisma.meal.deleteMany({ where: { id, userId } });
  if (res.count === 0) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
