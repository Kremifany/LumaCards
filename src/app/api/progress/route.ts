import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SaveProgressBody = {
  userKey: string;
  topicId: string;
  completedCards: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SaveProgressBody>;
  const userKey = body.userKey?.trim();
  const topicId = body.topicId?.trim();
  const completedCards = Math.max(0, Number(body.completedCards ?? 0));

  if (!userKey || !topicId || Number.isNaN(completedCards)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.topicProgress.upsert({
    where: {
      userKey_topicId: { userKey, topicId },
    },
    update: {
      completedCards,
    },
    create: {
      userKey,
      topicId,
      completedCards,
    },
  });

  return NextResponse.json({ ok: true });
}
