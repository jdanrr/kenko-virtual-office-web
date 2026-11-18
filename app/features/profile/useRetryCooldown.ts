import { onUnmounted, ref } from "vue";

/**
 * Pausa entre reintentos (evita saturar el microservicio).
 * `start()` bloquea el botón N segundos con cuenta visible;
 * se limpia solo al desmontar.
 */
export function useRetryCooldown(seconds = 5): {
  remaining: ReturnType<typeof ref<number>>;
  start: () => void;
} {
  const remaining = ref(0);
  let timer: ReturnType<typeof setInterval> | null = null;

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start(): void {
    stop();
    remaining.value = seconds;
    timer = setInterval(() => {
      remaining.value -= 1;
      if (remaining.value <= 0) stop();
    }, 1000);
  }

  onUnmounted(stop);

  return { remaining, start };
}
