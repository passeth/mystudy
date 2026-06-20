import { useEffect, useState } from "react";
import type { Manifest } from "./types";

let cache: Manifest | null = null;

export function useManifest() {
  const [data, setData] = useState<Manifest | null>(cache);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    fetch("/manifest.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`manifest ${r.status}`);
        return r.json();
      })
      .then((j: Manifest) => {
        if (!alive) return;
        cache = j;
        setData(j);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { data, error, loading };
}

export function findTopic(m: Manifest | null, id: string) {
  return m?.topics.find((t) => t.id === id) ?? null;
}
