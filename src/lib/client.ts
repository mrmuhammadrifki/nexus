"use client";
import { useEffect, useRef, useState } from "react";

export async function api<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Terjadi kesalahan");
  return data as T;
}

export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!url);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    let off = false;
    setLoading(true);
    api<T>(url).then((d) => !off && (setData(d), setError("")), (e) => !off && setError(e.message)).finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [url, tick]);
  return { data, error, loading, setData, reload: () => setTick((t) => t + 1) };
}

/** Debounce simpan: panggil `save()` 2 detik setelah perubahan terakhir (CR-1). */
export function useDebounced(fn: () => void, deps: unknown[], ms = 2000, enabled = true) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!enabled) return;
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
