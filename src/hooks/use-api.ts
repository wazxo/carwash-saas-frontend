"use client";

import { useState, useCallback } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (promise: Promise<T>): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await promise;
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: any) {
        setState({ data: null, loading: false, error: err.message || "Error" });
        return null;
      }
    },
    []
  );

  return { ...state, execute };
}
