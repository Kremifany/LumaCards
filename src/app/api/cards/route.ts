import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_CARDS_PER_TOPIC = 300;

type CreateCardBody = {
  topicId: string;
  question: string;
  answer: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateCardBody>;
  const topicId = body.topicId?.trim();
  const question = body.question?.trim();
  const answer = body.answer?.trim();

  if (!topicId || !question || !answer) {
    return NextResponse.json(
      { error: "topicId, question, and answer are required." },
      { status: 400 }
    );
  }

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      cards: {
        orderBy: { order: "desc" },
        take: 1,
      },
      _count: {
        select: { cards: true },
      },
    },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  if (topic._count.cards >= MAX_CARDS_PER_TOPIC) {
    return NextResponse.json(
      { error: `This topic already has ${MAX_CARDS_PER_TOPIC} cards.` },
      { status: 400 }
    );
  }

  const nextOrder = topic.cards[0] ? topic.cards[0].order + 1 : 0;
  const card = await prisma.card.create({
    data: {
      topicId,
      question,
      answer,
      order: nextOrder,
    },
    select: {
      id: true,
      question: true,
      answer: true,
    },
  });

  return NextResponse.json({ card }, { status: 201 });
}
