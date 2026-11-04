"use client";

interface TelegramWebApp {
  initData: string;
  colorScheme: "light" | "dark";
  ready: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const SDK_URL = "https://telegram.org/js/telegram-web-app.js";

// Гарантированная загрузка SDK: ждём onload, чтобы не словить гонку с useEffect.
function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.Telegram?.WebApp) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_URL}"]`,
    );
    if (existing) {
      if (window.Telegram?.WebApp) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => resolve(), { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
}

export async function getWebApp(): Promise<TelegramWebApp | null> {
  await loadScript();
  return window.Telegram?.WebApp ?? null;
}

export function getInitData(): string {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData ?? "";
}

// fetch с подписью Telegram в заголовке — её проверяет сервер.
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("X-Telegram-Init-Data", getInitData());
  return fetch(path, { ...init, headers });
}
