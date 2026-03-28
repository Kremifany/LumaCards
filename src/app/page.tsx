"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FlashCard = {
  id: string;
  question: string;
  answer: string;
};

type Topic = {
  id: string;
  name: string;
  cards: FlashCard[];
};

type Subject = {
  id: string;
  name: string;
  topics: Topic[];
};

type EntityType = "subject" | "topic" | "card";

type EditModalState =
  | { entityType: "subject"; id: string; name: string }
  | { entityType: "topic"; id: string; name: string }
  | { entityType: "card"; id: string; question: string; answer: string };

type DeleteModalState = {
  entityType: EntityType;
  id: string;
  label: string;
};

const APP_NAME = "LumaCards";
const MAX_CARDS_PER_TOPIC = 100;
const THEME_STORAGE_KEY = "lumacards-theme";
const SOLVED_CARDS_STORAGE_KEY_PREFIX = "lumacards-solved-cards";
type ThemeMode = "light" | "dark";

function clampProgress(value: number, max: number) {
  return Math.min(Math.max(value, 0), max);
}

function getOrCreateUserKey() {
  const storageKey = "lumacards-user-key";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const next = `user_${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, next);
  return next;
}

function getSolvedCardsStorageKey(userKey: string) {
  return `${SOLVED_CARDS_STORAGE_KEY_PREFIX}:${userKey}`;
}

function parseSolvedCards(raw: string | null): Record<string, string[]> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};

    const normalized: Record<string, string[]> = {};
    for (const [topicId, solved] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(solved)) {
        normalized[topicId] = solved.filter((item): item is string => typeof item === "string");
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

function getInitialTheme(): ThemeMode {
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSolvedCountForTopic(topic: Topic | undefined, solvedCardsByTopic: Record<string, string[]>) {
  if (!topic) return 0;
  const validCardIds = new Set(topic.cards.map((card) => card.id));
  const solved = new Set(solvedCardsByTopic[topic.id] ?? []);
  let count = 0;
  for (const cardId of solved) {
    if (validCardIds.has(cardId)) count += 1;
  }
  return clampProgress(count, topic.cards.length);
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [userKey, setUserKey] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("light");

  const [topicProgress, setTopicProgress] = useState<Record<string, number>>({});
  const [solvedCardsByTopic, setSolvedCardsByTopic] = useState<Record<string, string[]>>({});
  const [addCardSubjectId, setAddCardSubjectId] = useState("");
  const [addCardTopicId, setAddCardTopicId] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [addCardMessage, setAddCardMessage] = useState("");
  const [addCardError, setAddCardError] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [structureMessage, setStructureMessage] = useState("");
  const [structureError, setStructureError] = useState("");
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [modalError, setModalError] = useState("");
  const [isModalSaving, setIsModalSaving] = useState(false);
  const newTopicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const nextUserKey = getOrCreateUserKey();
    setUserKey(nextUserKey);
    setSolvedCardsByTopic(
      parseSolvedCards(window.localStorage.getItem(getSolvedCardsStorageKey(nextUserKey)))
    );

    async function loadData() {
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await fetch(
          `/api/study-data?userKey=${encodeURIComponent(nextUserKey)}`
        );
        if (!response.ok) {
          throw new Error("Could not load study data.");
        }

        const data = (await response.json()) as {
          subjects: Subject[];
          progress: Record<string, number>;
        };
        setSubjects(data.subjects);
        setTopicProgress(data.progress ?? {});

        const firstSubject = data.subjects[0];
        const firstTopic = firstSubject?.topics[0];
        setSelectedSubjectId((prev) => prev || firstSubject?.id || "");
        setSelectedTopicId((prev) => prev || firstTopic?.id || "");
        setAddCardSubjectId((prev) => prev || firstSubject?.id || "");
        setAddCardTopicId((prev) => prev || firstTopic?.id || "");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load study data.";
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!userKey) return;
    window.localStorage.setItem(
      getSolvedCardsStorageKey(userKey),
      JSON.stringify(solvedCardsByTopic)
    );
  }, [userKey, solvedCardsByTopic]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );
  const selectedTopic = useMemo(
    () => selectedSubject?.topics.find((topic) => topic.id === selectedTopicId),
    [selectedSubject, selectedTopicId]
  );

  useEffect(() => {
    if (!subjects.length) return;

    const subjectExists = subjects.some((item) => item.id === selectedSubjectId);
    if (!subjectExists) {
      const fallbackSubject = subjects[0];
      setSelectedSubjectId(fallbackSubject.id);
      setSelectedTopicId(fallbackSubject.topics[0]?.id ?? "");
      return;
    }

    if (!selectedSubject) return;
    const topicExists = selectedSubject.topics.some((item) => item.id === selectedTopicId);
    if (!topicExists) {
      setSelectedTopicId(selectedSubject.topics[0]?.id ?? "");
    }
  }, [subjects, selectedSubjectId, selectedTopicId, selectedSubject]);

  const completedCards = selectedTopic
    ? getSolvedCountForTopic(selectedTopic, solvedCardsByTopic)
    : 0;
  const totalCards = selectedTopic?.cards.length ?? 0;
  const progressPercent = totalCards === 0 ? 0 : (completedCards / totalCards) * 100;
  const isTopicComplete = completedCards >= totalCards;
  const currentCard = selectedTopic?.cards[currentCardIndex];
  const currentCardSolved =
    !!selectedTopic &&
    !!currentCard &&
    (solvedCardsByTopic[selectedTopic.id] ?? []).includes(currentCard.id);
  const hasPreviousCard = currentCardIndex > 0;
  const hasNextCard = selectedTopic ? currentCardIndex < selectedTopic.cards.length - 1 : false;

  useEffect(() => {
    if (!selectedTopic) {
      setCurrentCardIndex(0);
      return;
    }

    setCurrentCardIndex((prev) =>
      clampProgress(prev, Math.max(selectedTopic.cards.length - 1, 0))
    );
  }, [selectedTopic]);

  const saveTopicProgress = async (topicId: string, completed: number) => {
    if (!userKey) return;

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userKey,
          topicId,
          completedCards: completed,
        }),
      });
    } catch {
      // Keep UI optimistic even if network fails.
    }
  };

  const selectTopic = (subjectId: string, topicId: string) => {
    const topic = subjects
      .find((subject) => subject.id === subjectId)
      ?.topics.find((item) => item.id === topicId);
    const completed = getSolvedCountForTopic(topic, solvedCardsByTopic);
    const nextIndex =
      topic && topic.cards.length > 0 ? clampProgress(completed, topic.cards.length - 1) : 0;

    setSelectedSubjectId(subjectId);
    setSelectedTopicId(topicId);
    setCurrentCardIndex(nextIndex);
    setShowAnswer(false);
  };

  const completeCurrentCard = () => {
    if (!selectedTopic || !currentCard || currentCardSolved) return;

    setSolvedCardsByTopic((prev) => {
      const existingSolved = new Set(prev[selectedTopic.id] ?? []);
      if (existingSolved.has(currentCard.id)) {
        return prev;
      }

      existingSolved.add(currentCard.id);
      const nextSolvedForTopic = [...existingSolved];
      const nextValue = getSolvedCountForTopic(
        {
          ...selectedTopic,
          cards: selectedTopic.cards,
        },
        { ...prev, [selectedTopic.id]: nextSolvedForTopic }
      );
      setTopicProgress((prevProgress) => ({ ...prevProgress, [selectedTopic.id]: nextValue }));
      void saveTopicProgress(selectedTopic.id, nextValue);
      return {
        ...prev,
        [selectedTopic.id]: nextSolvedForTopic,
      };
    });
    setCurrentCardIndex((prev) => Math.min(prev + 1, Math.max(totalCards - 1, 0)));
    setShowAnswer(false);
  };

  const goToPreviousCard = () => {
    setCurrentCardIndex((prev) => Math.max(prev - 1, 0));
    setShowAnswer(false);
  };

  const goToNextCard = () => {
    setCurrentCardIndex((prev) => Math.min(prev + 1, Math.max(totalCards - 1, 0)));
    setShowAnswer(false);
  };

  const resetTopic = (topicId: string) => {
    void saveTopicProgress(topicId, 0);
    setTopicProgress((prev) => ({ ...prev, [topicId]: 0 }));
    setSolvedCardsByTopic((prev) => {
      const next = { ...prev };
      delete next[topicId];
      return next;
    });
    if (selectedTopicId === topicId) {
      setCurrentCardIndex(0);
      setShowAnswer(false);
    }
  };

  const resetSubject = (subjectId: string) => {
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) return;

    setTopicProgress((prev) => {
      const next = { ...prev };
      subject.topics.forEach((topic) => {
        next[topic.id] = 0;
        void saveTopicProgress(topic.id, 0);
      });
      return next;
    });
    setSolvedCardsByTopic((prev) => {
      const next = { ...prev };
      subject.topics.forEach((topic) => {
        delete next[topic.id];
      });
      return next;
    });
    if (subjectId === selectedSubjectId) {
      setCurrentCardIndex(0);
      setShowAnswer(false);
    }
  };

  const subjectIsComplete = (subject: Subject) =>
    subject.topics.every(
      (topic) => getSolvedCountForTopic(topic, solvedCardsByTopic) >= topic.cards.length
    );

  const topicIsComplete = (topic: Topic) =>
    getSolvedCountForTopic(topic, solvedCardsByTopic) >= topic.cards.length;

  const addCardSubject = useMemo(
    () => subjects.find((subject) => subject.id === addCardSubjectId),
    [subjects, addCardSubjectId]
  );
  const addCardTopics = addCardSubject?.topics ?? [];
  const addCardTopic =
    addCardTopics.find((topic) => topic.id === addCardTopicId) ?? addCardTopics[0];
  const addCardTopicCount = addCardTopic?.cards.length ?? 0;
  const addCardTopicAtLimit = addCardTopicCount >= MAX_CARDS_PER_TOPIC;

  useEffect(() => {
    if (!addCardSubject) return;
    const exists = addCardSubject.topics.some((topic) => topic.id === addCardTopicId);
    if (!exists) {
      setAddCardTopicId(addCardSubject.topics[0]?.id ?? "");
    }
  }, [addCardSubject, addCardTopicId]);

  const openEditModal = (state: EditModalState) => {
    setModalError("");
    setEditModal(state);
  };

  const openDeleteModal = (state: DeleteModalState) => {
    setModalError("");
    setDeleteModal(state);
  };

  const getFirstAvailableSelection = (items: Subject[]) => {
    const firstSubject = items[0];
    return {
      subjectId: firstSubject?.id ?? "",
      topicId: firstSubject?.topics[0]?.id ?? "",
    };
  };

  const saveEditModal = async () => {
    if (!editModal) return;

    try {
      setIsModalSaving(true);
      setModalError("");

      const response = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editModal),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save changes.");
      }

      setSubjects((prev) =>
        prev.map((subject) => {
          if (editModal.entityType === "subject" && subject.id === editModal.id) {
            return { ...subject, name: editModal.name.trim() };
          }
          return {
            ...subject,
            topics: subject.topics.map((topic) => {
              if (editModal.entityType === "topic" && topic.id === editModal.id) {
                return { ...topic, name: editModal.name.trim() };
              }
              if (editModal.entityType === "card") {
                return {
                  ...topic,
                  cards: topic.cards.map((card) =>
                    card.id === editModal.id
                      ? {
                          ...card,
                          question: editModal.question.trim(),
                          answer: editModal.answer.trim(),
                        }
                      : card
                  ),
                };
              }
              return topic;
            }),
          };
        })
      );
      setEditModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save changes.";
      setModalError(message);
    } finally {
      setIsModalSaving(false);
    }
  };

  const confirmDeleteModal = async () => {
    if (!deleteModal) return;

    try {
      setIsModalSaving(true);
      setModalError("");

      const response = await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteModal),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not delete item.");
      }

      if (deleteModal.entityType === "subject") {
        const nextSubjects = subjects.filter((subject) => subject.id !== deleteModal.id);
        setSubjects(nextSubjects);
        const selection = getFirstAvailableSelection(nextSubjects);

        if (!nextSubjects.some((subject) => subject.id === selectedSubjectId)) {
          setSelectedSubjectId(selection.subjectId);
          setSelectedTopicId(selection.topicId);
        }
        if (!nextSubjects.some((subject) => subject.id === addCardSubjectId)) {
          setAddCardSubjectId(selection.subjectId);
          setAddCardTopicId(selection.topicId);
        }
      }

      if (deleteModal.entityType === "topic") {
        const nextSubjects = subjects.map((subject) => ({
          ...subject,
          topics: subject.topics.filter((topic) => topic.id !== deleteModal.id),
        }));
        setSubjects(nextSubjects);

        const selection = getFirstAvailableSelection(nextSubjects);
        const selectedSubjectNext = nextSubjects.find((subject) => subject.id === selectedSubjectId);
        if (!selectedSubjectNext || !selectedSubjectNext.topics.some((topic) => topic.id === selectedTopicId)) {
          setSelectedTopicId(selectedSubjectNext?.topics[0]?.id ?? selection.topicId);
          setCurrentCardIndex(0);
        }
        const addCardSubjectNext = nextSubjects.find((subject) => subject.id === addCardSubjectId);
        if (!addCardSubjectNext || !addCardSubjectNext.topics.some((topic) => topic.id === addCardTopicId)) {
          setAddCardTopicId(addCardSubjectNext?.topics[0]?.id ?? selection.topicId);
        }
      }

      if (deleteModal.entityType === "card") {
        const nextSubjects = subjects.map((subject) => ({
          ...subject,
          topics: subject.topics.map((topic) => ({
            ...topic,
            cards: topic.cards.filter((card) => card.id !== deleteModal.id),
          })),
        }));
        setSubjects(nextSubjects);
        setShowAnswer(false);
      }

      setDeleteModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete item.";
      setModalError(message);
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleAddSubject = async () => {
    const name = newSubjectName.trim();
    if (!name) {
      setStructureError("Enter a subject name.");
      setStructureMessage("");
      return;
    }

    try {
      setIsAddingSubject(true);
      setStructureError("");
      setStructureMessage("");

      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "subject", name }),
      });
      const payload = (await response.json()) as { error?: string; subject?: Subject };

      if (!response.ok || !payload.subject) {
        throw new Error(payload.error ?? "Could not add subject.");
      }

      const subject = payload.subject;
      setSubjects((prev) => [...prev, { ...subject, topics: subject.topics ?? [] }]);
      setSelectedSubjectId(subject.id);
      setSelectedTopicId(subject.topics[0]?.id ?? "");
      setAddCardSubjectId(subject.id);
      setAddCardTopicId(subject.topics[0]?.id ?? "");
      setCurrentCardIndex(0);
      setNewSubjectName("");
      setStructureMessage(`Subject "${subject.name}" added. Now add a topic.`);
      window.setTimeout(() => {
        newTopicInputRef.current?.focus();
      }, 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add subject.";
      setStructureError(message);
      setStructureMessage("");
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleAddTopic = async () => {
    const name = newTopicName.trim();
    if (!addCardSubjectId) {
      setStructureError("Choose a subject first.");
      setStructureMessage("");
      return;
    }
    if (!name) {
      setStructureError("Enter a topic name.");
      setStructureMessage("");
      return;
    }

    try {
      setIsAddingTopic(true);
      setStructureError("");
      setStructureMessage("");

      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "topic",
          subjectId: addCardSubjectId,
          name,
        }),
      });
      const payload = (await response.json()) as { error?: string; topic?: Topic };

      if (!response.ok || !payload.topic) {
        throw new Error(payload.error ?? "Could not add topic.");
      }

      const topic = { ...payload.topic, cards: payload.topic.cards ?? [] };
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === addCardSubjectId
            ? { ...subject, topics: [...subject.topics, topic] }
            : subject
        )
      );

      setSelectedSubjectId(addCardSubjectId);
      setSelectedTopicId(topic.id);
      setAddCardTopicId(topic.id);
      setCurrentCardIndex(0);
      setNewTopicName("");
      setStructureMessage(`Topic "${topic.name}" added.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add topic.";
      setStructureError(message);
      setStructureMessage("");
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleAddCard = async () => {
    const topicId = addCardTopic?.id;
    const question = newQuestion.trim();
    const answer = newAnswer.trim();

    if (!topicId || !question || !answer) {
      setAddCardError("Choose a topic and fill both question and answer.");
      setAddCardMessage("");
      return;
    }

    if (addCardTopicAtLimit) {
      setAddCardError(`This topic already has ${MAX_CARDS_PER_TOPIC} cards.`);
      setAddCardMessage("");
      return;
    }

    try {
      setIsAddingCard(true);
      setAddCardError("");
      setAddCardMessage("");

      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, question, answer }),
      });

      const payload = (await response.json()) as
        | { error: string }
        | { card: FlashCard };

      if (!response.ok || !("card" in payload)) {
        throw new Error("error" in payload ? payload.error : "Could not add card.");
      }

      setSubjects((prev) =>
        prev.map((subject) => ({
          ...subject,
          topics: subject.topics.map((topic) =>
            topic.id === topicId ? { ...topic, cards: [...topic.cards, payload.card] } : topic
          ),
        }))
      );
      setNewQuestion("");
      setNewAnswer("");
      setAddCardMessage("Card added successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add card.";
      setAddCardError(message);
      setAddCardMessage("");
    } finally {
      setIsAddingCard(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-cyan-50 to-emerald-50 px-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <p className="rounded-lg border border-indigo-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          Loading your flashcards...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-cyan-50 to-emerald-50 px-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-md rounded-xl border border-rose-200 bg-white p-5 text-center shadow-sm dark:border-rose-900 dark:bg-slate-900">
          <p className="text-lg font-semibold text-rose-700">Could not load data</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-cyan-50 to-emerald-50 text-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <nav className="border-b border-indigo-100 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">
                Learn Better
              </p>
              <h1 className="text-2xl font-bold text-indigo-950 dark:text-indigo-200">
                {APP_NAME}
              </h1>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
              <span>Current Topic Progress</span>
              <span>
                {completedCards}/{totalCards}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-indigo-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-linear-to-r from-indigo-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            Subjects & Topics
          </h2>
          <div className="space-y-4">
            {subjects.map((subject) => {
              const isSelectedSubject = subject.id === selectedSubjectId;
              const completedSubject = subjectIsComplete(subject);

              return (
                <section
                  key={subject.id}
                  className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3
                      className={`font-semibold ${
                        isSelectedSubject
                          ? "text-indigo-800 dark:text-indigo-200"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal({
                            entityType: "subject",
                            id: subject.id,
                            name: subject.name,
                          })
                        }
                        className="rounded-md border border-indigo-200 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/40 dark:text-indigo-200 dark:hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openDeleteModal({
                            entityType: "subject",
                            id: subject.id,
                            label: subject.name,
                          })
                        }
                        className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-slate-700"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        disabled={!completedSubject}
                        onClick={() => resetSubject(subject.id)}
                        className="rounded-md border border-indigo-200 px-2 py-1 text-[11px] font-medium text-indigo-700 enabled:hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-indigo-400/40 dark:text-indigo-200 dark:enabled:hover:bg-slate-700"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {subject.topics.map((topic) => {
                      const isSelectedTopic = topic.id === selectedTopicId;
                      const completed = topicIsComplete(topic);
                      const done = getSolvedCountForTopic(topic, solvedCardsByTopic);

                      return (
                        <div
                          key={topic.id}
                          className={`rounded-lg border p-2 ${
                            isSelectedTopic
                              ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500 dark:bg-slate-700"
                              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => selectTopic(subject.id, topic.id)}
                            className="mb-2 w-full text-left"
                          >
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {topic.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {done}/{topic.cards.length} cards done
                            </p>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal({
                                  entityType: "topic",
                                  id: topic.id,
                                  name: topic.name,
                                })
                              }
                              className="rounded-md border border-indigo-200 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/40 dark:text-indigo-200 dark:hover:bg-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openDeleteModal({
                                  entityType: "topic",
                                  id: topic.id,
                                  label: topic.name,
                                })
                              }
                              className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-slate-700"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => resetTopic(topic.id)}
                              className="rounded-md border border-cyan-200 px-2 py-1 text-[11px] font-medium text-cyan-700 hover:bg-cyan-50 dark:border-cyan-400/40 dark:text-cyan-200 dark:hover:bg-slate-700"
                            >
                              Start Over
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {selectedSubject ? (
            <>
              <p className="mb-1 text-sm font-semibold text-indigo-500 dark:text-indigo-300">
                {selectedSubject.name}
              </p>
              <h2 className="mb-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
                {selectedTopic?.name ?? "No topic selected"}
              </h2>

              {selectedTopic ? currentCard ? (
                <div className="space-y-4">
                  <div className="relative mx-auto min-h-64 w-full max-w-3xl px-12 perspective-distant">
                    <button
                      type="button"
                      onClick={goToPreviousCard}
                      disabled={!hasPreviousCard}
                      className="absolute top-1/2 -left-3 z-10 -translate-y-1/2 rounded-full border-2 border-slate-300 bg-white/95 px-3 py-2 text-2xl leading-none font-extrabold text-slate-700 shadow-md enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-500 dark:bg-slate-900/95 dark:text-slate-100 dark:enabled:hover:bg-slate-800"
                      aria-label="Previous card"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={goToNextCard}
                      disabled={!hasNextCard}
                      className="absolute top-1/2 -right-3 z-10 -translate-y-1/2 rounded-full border-2 border-slate-300 bg-white/95 px-3 py-2 text-2xl leading-none font-extrabold text-slate-700 shadow-md enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-500 dark:bg-slate-900/95 dark:text-slate-100 dark:enabled:hover:bg-slate-800"
                      aria-label="Next card"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAnswer((prev) => !prev)}
                      className="relative h-full min-h-64 w-full rounded-2xl text-left transition-transform duration-500 transform-3d"
                      style={{
                        transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50 to-white p-6 shadow-xs dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      >
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                          Question
                        </p>
                        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                          {currentCard.question}
                        </p>
                        <p className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-300">
                          Tap to flip card
                        </p>
                      </div>

                      <div
                        className="absolute inset-0 rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-6 shadow-xs dark:border-emerald-800 dark:from-emerald-950 dark:to-slate-900"
                        style={{
                          transform: "rotateY(180deg)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      >
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                          Answer
                        </p>
                        <p className="text-lg font-medium text-emerald-900 dark:text-emerald-100">
                          {currentCard.answer}
                        </p>
                        <p className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-300">
                          Tap to flip card
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <span className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-400/40 dark:bg-slate-800 dark:text-indigo-200">
                      Solved {completedCards}/{totalCards}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        currentCard &&
                        openEditModal({
                          entityType: "card",
                          id: currentCard.id,
                          question: currentCard.question,
                          answer: currentCard.answer,
                        })
                      }
                      className="rounded-lg border border-indigo-200 bg-white px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400/40 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-slate-800"
                    >
                      Edit Card
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        currentCard &&
                        openDeleteModal({
                          entityType: "card",
                          id: currentCard.id,
                          label: currentCard.question,
                        })
                      }
                      className="rounded-lg border border-rose-200 bg-white px-4 py-2 font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-slate-800"
                    >
                      Delete Card
                    </button>
                    {showAnswer && (
                      <button
                        type="button"
                        onClick={completeCurrentCard}
                        disabled={currentCardSolved}
                        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {currentCardSolved ? "Already Solved" : "I Got It"}
                      </button>
                    )}
                  </div>

                  {isTopicComplete && (
                    <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-4 dark:border-emerald-800 dark:from-emerald-950 dark:to-slate-900">
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                        Topic Complete
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        You can keep reviewing with Previous/Next, or start over.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => resetTopic(selectedTopic.id)}
                          className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-700"
                        >
                          Start Over Topic
                        </button>
                        <button
                          type="button"
                          onClick={() => resetSubject(selectedSubject.id)}
                          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
                        >
                          Start Over Subject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    This topic has no cards yet.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    No topics in this subject yet. Add a topic below to get started.
                  </p>
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-indigo-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">
                  Add Learning Content
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Add subject, add topic to a subject, then add cards to a topic.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      New Subject
                    </span>
                    <input
                      value={newSubjectName}
                      onChange={(event) => setNewSubjectName(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="e.g. Anatomy"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    disabled={isAddingSubject}
                    className="self-end rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAddingSubject ? "Adding..." : "Add Subject"}
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Subject
                    </span>
                    <select
                      value={addCardSubjectId}
                      onChange={(event) => setAddCardSubjectId(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      New Topic for Selected Subject
                    </span>
                    <input
                      ref={newTopicInputRef}
                      value={newTopicName}
                      onChange={(event) => setNewTopicName(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="e.g. Histology"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    disabled={isAddingTopic || !addCardSubjectId}
                    className="self-end rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAddingTopic ? "Adding..." : "Add Topic"}
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Topic for New Card
                    </span>
                    <select
                      value={addCardTopic?.id ?? ""}
                      onChange={(event) => setAddCardTopicId(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {addCardTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Cards in selected topic: {addCardTopicCount}/{MAX_CARDS_PER_TOPIC}
                </p>

                <label className="mt-4 block space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Question</span>
                  <textarea
                    value={newQuestion}
                    onChange={(event) => setNewQuestion(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Enter card question"
                  />
                </label>

                <label className="mt-3 block space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Answer</span>
                  <textarea
                    value={newAnswer}
                    onChange={(event) => setNewAnswer(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Enter card answer"
                  />
                </label>

                {addCardError && (
                  <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
                    {addCardError}
                  </p>
                )}
                {addCardMessage && (
                  <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {addCardMessage}
                  </p>
                )}
                {structureError && (
                  <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
                    {structureError}
                  </p>
                )}
                {structureMessage && (
                  <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {structureMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleAddCard}
                  disabled={isAddingCard || addCardTopicAtLimit || !addCardTopic}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAddingCard ? "Adding..." : "Add Card"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              No topics found. Seed your database to start learning.
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        className="fixed right-5 bottom-5 z-40 rounded-full border border-indigo-300 bg-white p-3 text-indigo-700 shadow-lg hover:bg-indigo-50 dark:border-indigo-500/60 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-slate-800"
      >
        {theme === "dark" ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3c0 5 3.99 9 8.99 9 .27 0 .53-.01.8-.04" />
          </svg>
        )}
      </button>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-lg rounded-xl border border-indigo-100 bg-white p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Edit {editModal.entityType}
            </h3>

            {editModal.entityType === "subject" || editModal.entityType === "topic" ? (
              <label className="mt-4 block space-y-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Name</span>
                <input
                  value={editModal.name}
                  onChange={(event) =>
                    setEditModal((prev) =>
                      prev && (prev.entityType === "subject" || prev.entityType === "topic")
                        ? { ...prev, name: event.target.value }
                        : prev
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Question</span>
                  <textarea
                    rows={3}
                    value={editModal.question}
                    onChange={(event) =>
                      setEditModal((prev) =>
                        prev && prev.entityType === "card"
                          ? { ...prev, question: event.target.value }
                          : prev
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Answer</span>
                  <textarea
                    rows={3}
                    value={editModal.answer}
                    onChange={(event) =>
                      setEditModal((prev) =>
                        prev && prev.entityType === "card"
                          ? { ...prev, answer: event.target.value }
                          : prev
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
              </div>
            )}

            {modalError && (
              <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
                {modalError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalError("");
                  setEditModal(null);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditModal}
                disabled={isModalSaving}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isModalSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-5 shadow-lg dark:border-rose-900 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-rose-700 dark:text-rose-300">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
              Delete this {deleteModal.entityType}:{" "}
              <span className="font-semibold">{deleteModal.label}</span>?
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This action cannot be undone.
            </p>
            {modalError && (
              <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
                {modalError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalError("");
                  setDeleteModal(null);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteModal}
                disabled={isModalSaving}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isModalSaving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
