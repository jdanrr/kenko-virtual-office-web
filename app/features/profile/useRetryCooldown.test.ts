import { describe, expect, it, vi } from "vitest";

import { useRetryCooldown } from "./useRetryCooldown";

describe("useRetryCooldown", () => {
  it("bloquea 5 s con cuenta regresiva visible", () => {
    vi.useFakeTimers();
    try {
      const { remaining, start } = useRetryCooldown(5);
      expect(remaining.value).toBe(0);
      start();
      expect(remaining.value).toBe(5);
      vi.advanceTimersByTime(2000);
      expect(remaining.value).toBe(3);
      vi.advanceTimersByTime(3000);
      expect(remaining.value).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reiniciar el contador reemplaza el anterior (sin fugas)", () => {
    vi.useFakeTimers();
    try {
      const { remaining, start } = useRetryCooldown(5);
      start();
      vi.advanceTimersByTime(4000);
      start();
      expect(remaining.value).toBe(5);
      vi.advanceTimersByTime(5000);
      expect(remaining.value).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
