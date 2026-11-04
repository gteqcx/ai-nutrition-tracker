"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/telegram";
import ProgressBar from "./ProgressBar";
import ManualMealForm from "./ManualMealForm";

export interface UserData {
  goal: "lose" | "maintain" | "gain";
  targets: { calories: number; protein: number; fat: number; carbs: number };
}

export interface Meal {
  id: number;
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  createdAt: string;
}

const GOAL_LABEL: Record<UserData["goal"], string> = {
  lose: "Похудение",
  maintain: "Поддержание",
  gain: "Набор массы",
};

export default function Dashboard({ user }: { user: UserData }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/meals")
      .then((r) => r.json())
      .then((d) => setMeals(d.meals ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: number) {
    const res = await apiFetch(`/api/meals/${id}`, { method: "DELETE" });
    if (res.ok) setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  const sum = meals.reduce(
    (a, m) => ({
      calories: a.calories + m.calories,
      protein: a.protein + m.protein,
      fat: a.fat + m.fat,
      carbs: a.carbs + m.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
  const t = user.targets;

  return (
    <main className="mx-auto w-full max-w-md flex-1 p-4">
      <header className="mb-5">
        <h1 className="text-xl font-bold">Сегодня</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Цель: {GOAL_LABEL[user.goal]}
        </p>
      </header>

      <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
        <div className="mb-4 text-center">
          <div className="text-3xl font-bold">{sum.calories}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            из {t.calories} ккал
          </div>
        </div>
        <div className="space-y-3">
          <ProgressBar
            label="Калории"
            consumed={sum.calories}
            target={t.calories}
            unit="ккал"
            color="bg-emerald-500"
          />
          <ProgressBar
            label="Белки"
            consumed={sum.protein}
            target={t.protein}
            unit="г"
            color="bg-sky-500"
          />
          <ProgressBar
            label="Жиры"
            consumed={sum.fat}
            target={t.fat}
            unit="г"
            color="bg-amber-500"
          />
          <ProgressBar
            label="Углеводы"
            consumed={sum.carbs}
            target={t.carbs}
            unit="г"
            color="bg-violet-500"
          />
        </div>
      </section>

      <section>
        <div className="mb-3">
          <ManualMealForm onAdded={(m) => setMeals((prev) => [m, ...prev])} />
        </div>
        <h2 className="mb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
          Приёмы пищи
        </h2>
        {loading ? (
          <p className="py-8 text-center text-gray-400">Загрузка…</p>
        ) : meals.length === 0 ? (
          <p className="py-8 text-center text-gray-400">
            Пока пусто. Напиши боту, что съел, или пришли фото.
          </p>
        ) : (
          <ul className="space-y-2">
            {meals.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{m.description}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {m.calories} ккал · Б{m.protein} Ж{m.fat} У{m.carbs} ·{" "}
                    {new Date(m.createdAt).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <button
                  onClick={() => remove(m.id)}
                  className="ml-3 shrink-0 rounded-lg px-2 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  aria-label="Удалить"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
