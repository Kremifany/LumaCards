import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_CARDS_PER_TOPIC = 100;

export async function GET(request: NextRequest) {
  const userKey = request.nextUrl.searchParams.get("userKey");

  if (!userKey) {
    return NextResponse.json({ error: "Missing userKey" }, { status: 400 });
  }

  const [subjects, progressRows] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: {
        topics: {
          orderBy: { order: "asc" },
          include: {
            cards: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    }),
    prisma.topicProgress.findMany({
      where: { userKey },
      select: { topicId: true, completedCards: true },
    }),
  ]);

  const progress: Record<string, number> = {};
  for (const row of progressRows) {
    progress[row.topicId] = row.completedCards;
  }

  const normalizedSubjects = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    topics: subject.topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      cards: topic.cards.slice(0, MAX_CARDS_PER_TOPIC).map((card) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
      })),
    })),
  }));

  return NextResponse.json({ subjects: normalizedSubjects, progress });
}
