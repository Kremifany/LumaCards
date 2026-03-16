import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ContentEntity = "subject" | "topic" | "card";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function buildUniqueSubjectSlug(name: string) {
  const base = slugify(name) || "subject";
  let attempt = base;
  let idx = 2;
  while (await prisma.subject.findUnique({ where: { slug: attempt }, select: { id: true } })) {
    attempt = `${base}-${idx}`;
    idx += 1;
  }
  return attempt;
}

async function buildUniqueTopicSlug(subjectId: string, name: string) {
  const base = slugify(name) || "topic";
  let attempt = base;
  let idx = 2;
  while (
    await prisma.topic.findFirst({
      where: { subjectId, slug: attempt },
      select: { id: true },
    })
  ) {
    attempt = `${base}-${idx}`;
    idx += 1;
  }
  return attempt;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    entityType: "subject" | "topic";
    name: string;
    subjectId: string;
  }>;
  const entityType = body.entityType;
  const name = body.name?.trim();

  if (!entityType || !name) {
    return NextResponse.json({ error: "entityType and name are required." }, { status: 400 });
  }

  if (entityType === "subject") {
    const slug = await buildUniqueSubjectSlug(name);
    const subject = await prisma.subject.create({
      data: { name, slug },
      include: {
        topics: {
          orderBy: { order: "asc" },
          include: { cards: { orderBy: { order: "asc" } } },
        },
      },
    });
    return NextResponse.json({ subject }, { status: 201 });
  }

  const subjectId = body.subjectId?.trim();
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId is required for topic." }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });
  if (!subject) {
    return NextResponse.json({ error: "Subject not found." }, { status: 404 });
  }

  const order = await prisma.topic.count({ where: { subjectId } });
  const slug = await buildUniqueTopicSlug(subjectId, name);
  const topic = await prisma.topic.create({
    data: {
      subjectId,
      name,
      slug,
      order,
    },
    include: {
      cards: {
        orderBy: { order: "asc" },
      },
    },
  });
  return NextResponse.json({ topic }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Partial<{
    entityType: ContentEntity;
    id: string;
    name: string;
    question: string;
    answer: string;
  }>;

  const entityType = body.entityType;
  const id = body.id?.trim();
  if (!entityType || !id) {
    return NextResponse.json({ error: "Missing entityType or id." }, { status: 400 });
  }

  if (entityType === "subject") {
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Subject name is required." }, { status: 400 });
    }
    const subject = await prisma.subject.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
    return NextResponse.json({ subject });
  }

  if (entityType === "topic") {
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Topic name is required." }, { status: 400 });
    }
    const topic = await prisma.topic.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });
    return NextResponse.json({ topic });
  }

  const question = body.question?.trim();
  const answer = body.answer?.trim();
  if (!question || !answer) {
    return NextResponse.json(
      { error: "Card question and answer are required." },
      { status: 400 }
    );
  }
  const card = await prisma.card.update({
    where: { id },
    data: { question, answer },
    select: { id: true, question: true, answer: true },
  });
  return NextResponse.json({ card });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as Partial<{
    entityType: ContentEntity;
    id: string;
  }>;
  const entityType = body.entityType;
  const id = body.id?.trim();

  if (!entityType || !id) {
    return NextResponse.json({ error: "Missing entityType or id." }, { status: 400 });
  }

  if (entityType === "subject") {
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  if (entityType === "topic") {
    await prisma.topic.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  await prisma.card.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
