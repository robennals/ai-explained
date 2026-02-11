"use client";

import { useState, useEffect } from "react";

export interface EmbeddingData {
  words: string[];
  vectors: number[][];
}

let cachedData: EmbeddingData | null = null;
let fetchPromise: Promise<EmbeddingData> | null = null;

function fetchData(): Promise<EmbeddingData> {
  if (cachedData) return Promise.resolve(cachedData);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/data/embeddings.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load embedding data: ${res.status}`);
      return res.json();
    })
    .then((data: EmbeddingData) => {
      cachedData = data;
      return data;
    });

  return fetchPromise;
}

export function useEmbeddingData(): {
  data: EmbeddingData | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<EmbeddingData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) return;

    let cancelled = false;
    fetchData()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
