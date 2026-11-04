"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/telegram";
import type { Meal } from "./Dashboard";

const numCls =
  "w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-center outline-none focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-800";

export default function ManualMealForm({
  onAdded,
}: {
  onAdded: (m: Meal) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setCalories("");
    setProtein("");
    setFat("");
    setCarbs("");
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Укажи название");
      return;
    }
    setBusy(true);
    setError("");
    const res = await apiFetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: name.trim(),
        calories: Math.round(Number(calories)) || 0,
        protein: Math.round(Number(protein)) || 0,
        fat: Math.round(Number(fat)) || 0,
        carbs: Math.round(Number(carbs)) || 0,
      }),
    });
    setBusy(false);
    if (res.ok) {
      const { meal } = await res.json();
      onAdded(meal);
      reset();
      setOpen(false);
    } else {
      setError("Не удалось сохранить");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-300"
      >
        + Добавить вручную
      </button>
    );
  }

  return (
    <form
      onSubmit={save}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800"
    >
      <input
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-800"
        placeholder="Название (напр. Банан)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-4 gap-2">
        <Labeled label="Ккал">
          <input
            className={numCls}
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </Labeled>
        <Labeled label="Б">
          <input
            className={numCls}
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
          />
        </Labeled>
        <Labeled label="Ж">
          <input
            className={numCls}
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
          />
        </Labeled>
        <Labeled label="У">
          <input
            className={numCls}
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
          />
        </Labeled>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-gray-600 dark:border-gray-600 dark:text-gray-300"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-center text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}
