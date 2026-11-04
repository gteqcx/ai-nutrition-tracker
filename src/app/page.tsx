"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, getWebApp } from "@/lib/telegram";
import OnboardingForm from "@/components/OnboardingForm";
import Dashboard, { type UserData } from "@/components/Dashboard";

type View = "loading" | "no-telegram" | "onboarding" | "dashboard";

export default function Home() {
  const [view, setView] = useState<View>("loading");
  const [user, setUser] = useState<UserData | null>(null);
  const [debug, setDebug] = useState("");

  const load = useCallback(async () => {
    const wa = await getWebApp();
    if (!wa) {
      setDebug("Telegram SDK не загрузился.");
      setView("no-telegram");
      return;
    }
    wa.ready();
    wa.expand();
    if (!wa.initData) {
      setDebug("initData пуст. Открой приложение кнопкой «Открыть» в боте.");
      setView("no-telegram");
      return;
    }
    const res = await apiFetch("/api/me");
    if (!res.ok) {
      setDebug(`Сервер ответил ${res.status} на /api/me.`);
      setView("no-telegram");
      return;
    }
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
      setView("dashboard");
    } else {
      setView("onboarding");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (view === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center p-4 text-gray-400">
        Загрузка…
      </main>
    );
  }

  if (view === "no-telegram") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-gray-500 dark:text-gray-400">
        <p>Открой это приложение через Telegram-бота.</p>
        {debug && <p className="text-xs text-gray-400">{debug}</p>}
      </main>
    );
  }

  if (view === "onboarding") {
    return <OnboardingForm onDone={load} />;
  }

  return <Dashboard user={user!} />;
}
