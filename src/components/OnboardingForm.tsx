"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/telegram";

type Gender = "male" | "female";
type Goal = "lose" | "maintain" | "gain";
type Activity = "sedentary" | "light" | "moderate" | "high" | "veryHigh";

const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = [
  { value: "sedentary", label: "Минимум движения" },
  { value: "light", label: "Лёгкая (1–3 трен/нед)" },
  { value: "moderate", label: "Средняя (3–5 трен/нед)" },
  { value: "high", label: "Высокая (6–7 трен/нед)" },
  { value: "veryHigh", label: "Очень высокая" },
];

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 dark:border-gray-600 dark:bg-gray-800";

export default function OnboardingForm({ onDone }: { onDone: () => void }) {
  const [gender, setGender] = useState<Gender>("male");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [activityLevel, setActivity] = useState<Activity>("moderate");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await apiFetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gender,
        goal,
        activityLevel,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        targetWeight: targetWeight ? Number(targetWeight) : undefined,
      }),
    });
    if (res.ok) {
      onDone();
    } else {
      setError("Проверь корректность данных и попробуй снова.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 p-4">
      <h1 className="mb-1 text-xl font-bold">Профиль</h1>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Рассчитаем твою суточную норму КБЖУ.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <Segmented
          label="Пол"
          value={gender}
          onChange={setGender}
          options={[
            { value: "male", label: "Мужской" },
            { value: "female", label: "Женский" },
          ]}
        />

        <div className="grid grid-cols-3 gap-3">
          <Field label="Возраст">
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </Field>
          <Field label="Рост, см">
            <input
              className={inputCls}
              type="number"
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              required
            />
          </Field>
          <Field label="Вес, кг">
            <input
              className={inputCls}
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </Field>
        </div>

        <Segmented
          label="Цель"
          value={goal}
          onChange={setGoal}
          options={[
            { value: "lose", label: "Похудение" },
            { value: "maintain", label: "Поддержание" },
            { value: "gain", label: "Набор" },
          ]}
        />

        <Field label="Целевой вес, кг (необязательно)">
          <input
            className={inputCls}
            type="number"
            inputMode="decimal"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />
        </Field>

        <Field label="Уровень активности">
          <select
            className={inputCls}
            value={activityLevel}
            onChange={(e) => setActivity(e.target.value as Activity)}
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {submitting ? "Сохраняем…" : "Рассчитать и сохранить"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-xl border px-2 py-2 text-sm transition ${
              value === o.value
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
