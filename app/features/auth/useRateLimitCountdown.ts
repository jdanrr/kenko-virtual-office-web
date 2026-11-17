import { onUnmounted, ref, watch } from "vue";

import type { AuthFailure } from "./api";

/**
 * Cuenta regresiva visible del 429.
 * La usa cualquier formulario con `store.lastFailure`: al llegar un
 * `rate-limited` descuenta cada segundo desde `retryAfterSeconds`.
 */
export function useRateLimitCountdown(
  getFailure: () => AuthFailure | null,
): { remaining: ReturnType<typeof ref<number>> } {
  const remaining = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  watch(getFailure, (failure) => {
    stop();
    if (failure?.kind === "rate-limited" && failure.retryAfterSeconds) {
      remaining.value = failure.retryAfterSeconds;
      timer = setInterval(() => {
        remaining.value -= 1;
        if (remaining.value <= 0) stop();
      }, 1000);
    }
  });

  onUnmounted(stop);

  return { remaining };
}
