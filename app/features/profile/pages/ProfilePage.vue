<script setup lang="ts">
// Página "Mi Perfil": muestra el perfil propio y permite editar lo permitido.
// Contacto vía PATCH Profile; correo y contraseña vía BFF de Authentication
// (modales con contraseña actual). Sin datos inventados.
import { computed, nextTick, onUnmounted, ref, watch } from "vue";

import { getServiceBases } from "~/core/config/services";
import { ApiError } from "~/core/api/apiError";
import { useAuthStore } from "~/features/auth";
import {
  AuthError,
  changeEmail,
  changePassword,
  failureFromUnknown,
} from "~/features/auth/api";
import type { AuthFailure } from "~/features/auth/api";
import { useRateLimitCountdown } from "~/features/auth/useRateLimitCountdown";
import { usePatchProfileMutation, useProfileQuery } from "../queries";
import { normalizeProfilePhone, profilePatchSchema } from "../schemas";
import {
  formatDocument,
  formatFullName,
  formatPhoneDisplayLocal,
  formatUpdatedAt,
  toProfilePageError,
} from "../profileView";
import type { Profile } from "../types";
import ProfileAccountCard from "../components/ProfileAccountCard.vue";
import ProfileAlert from "../components/ProfileAlert.vue";
import ProfileContactCard from "../components/ProfileContactCard.vue";
import ProfileEmailModal from "../components/ProfileEmailModal.vue";
import ProfilePasswordModal from "../components/ProfilePasswordModal.vue";
import ProfilePersonalCard from "../components/ProfilePersonalCard.vue";
import ProfileSecurityCard from "../components/ProfileSecurityCard.vue";
import ProfileStatePanel from "../components/ProfileStatePanel.vue";
import { useRetryCooldown } from "../useRetryCooldown";

const auth = useAuthStore();
const getAccessToken = () => auth.accessToken;
const getUserId = () => auth.user?.userId ?? null;

const bases = getServiceBases();
const profileQuery = useProfileQuery(getAccessToken, bases.profile, getUserId);
const patchMutation = usePatchProfileMutation(getAccessToken, bases.profile, getUserId);

const editing = ref(false);
const draftPhone = ref("");
const draftAddressLine = ref("");
const draftCity = ref("");
const fieldErrors = ref<Partial<Record<"phone" | "addressLine" | "city", string>>>({});
const showDiscard = ref(false);
const successMessage = ref<string | null>(null);
const submitError = ref<{ message: string; correlationId?: string } | null>(null);

/** Tarjeta de contacto (expone focos para mover el teclado al cambiar de modo). */
const contactCard = ref<{ focusPhone: () => void; focusEdit: () => void; focusCancel: () => void } | null>(null);
/** Botón "Seguir editando" del modal (foco inicial al abrirlo). */
const discardKeepButton = ref<HTMLButtonElement | null>(null);
/** Tarjetas Cuenta/Seguridad (foco de retorno al cerrar sus modales). */
const accountCard = ref<{ focusAction: () => void } | null>(null);
const securityCard = ref<{ focusAction: () => void } | null>(null);

/** Modal cambio de correo. */
const emailModalOpen = ref(false);
const emailNew = ref("");
const emailPassword = ref("");
const emailErrors = ref<Partial<Record<"newEmail" | "currentPassword", string>>>({});
const emailFailure = ref<AuthFailure | null>(null);
const emailPending = ref(false);
const emailServerError = ref<{ title: string; message: string; correlationId?: string } | null>(null);
const { remaining: emailCountdown } = useRateLimitCountdown(() => emailFailure.value);

/** Modal cambio de contraseña. */
const passwordModalOpen = ref(false);
const passwordCurrent = ref("");
const passwordNext = ref("");
const passwordConfirm = ref("");
const passwordErrors = ref<
  Partial<Record<"currentPassword" | "newPassword" | "confirmNewPassword", string>>
>({});
const passwordFailure = ref<AuthFailure | null>(null);
const passwordPending = ref(false);
const passwordServerError = ref<{ title: string; message: string; correlationId?: string } | null>(null);
const { remaining: passwordCountdown } = useRateLimitCountdown(() => passwordFailure.value);

let successTimer: ReturnType<typeof setTimeout> | null = null;

/** Pausa de 5 s entre reintentos (evita saturar el microservicio). */
const { remaining: retryCooldown, start: startRetryCooldown } = useRetryCooldown(5);

const profile = computed<Profile | null>(() => profileQuery.data.value ?? null);
const queryError = computed(() => toProfilePageError(profileQuery.error.value));
const isNotFound = computed(() => queryError.value?.kind === "not-found");
const isLoading = computed(() => profileQuery.isPending.value);
const savePending = computed(() => patchMutation.isPending.value);
const needsLogin = computed(() => !getUserId() && !isLoading.value && !profile.value);

/** Correo mostrado: Authentication (`/me`, inmediato), Profile como respaldo. */
const displayEmail = computed(
  () => auth.user?.email ?? profile.value?.email ?? "",
);

/** Iniciales del avatar (derivadas del nombre real, sin inventar nada). */
const initials = computed(() => {
  const current = profile.value;
  if (!current) return "";
  const first = current.first_name.trim().charAt(0) ?? "";
  const last = current.last_name.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
});

function resetDraft(current: Profile): void {
  draftPhone.value = formatPhoneDisplayLocal(current.phone);
  draftAddressLine.value = current.address_line;
  draftCity.value = current.city;
  fieldErrors.value = {};
}

watch(
  profile,
  (current) => {
    if (current && !editing.value) resetDraft(current);
  },
  { immediate: true },
);

const isDirty = computed(() => {
  const current = profile.value;
  if (!current) return false;
  return (
    normalizeProfilePhone(draftPhone.value) !== current.phone ||
    draftAddressLine.value.trim() !== current.address_line ||
    draftCity.value.trim() !== current.city
  );
});

function startEdit(): void {
  if (!profile.value) return;
  resetDraft(profile.value);
  submitError.value = null;
  successMessage.value = null;
  editing.value = true;
  // El botón que abrió la edición desaparece: lleva el foco al primer campo.
  void nextTick(() => contactCard.value?.focusPhone());
}

function cancelEdit(): void {
  if (isDirty.value) {
    showDiscard.value = true;
    return;
  }
  editing.value = false;
  fieldErrors.value = {};
  void nextTick(() => contactCard.value?.focusEdit());
}

function keepEditing(): void {
  showDiscard.value = false;
  void nextTick(() => contactCard.value?.focusCancel());
}

function confirmDiscard(): void {
  showDiscard.value = false;
  editing.value = false;
  fieldErrors.value = {};
  if (profile.value) resetDraft(profile.value);
  void nextTick(() => contactCard.value?.focusEdit());
}

watch(showDiscard, (open) => {
  // Al abrir el modal, el foco entra a su primera acción.
  if (open) void nextTick(() => discardKeepButton.value?.focus());
});

function onPhoneInput(value: string): void {
  draftPhone.value = formatPhoneDisplayLocal(value);
}

function mapIssuesToFields(
  issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>,
): Partial<Record<"phone" | "addressLine" | "city", string>> {
  const fields: Partial<Record<"phone" | "addressLine" | "city", string>> = {};
  for (const issue of issues) {
    const [first, second] = issue.path;
    if (first === "phone" && !fields.phone) fields.phone = issue.message;
    else if (first === "address" && second === "line" && !fields.addressLine) {
      fields.addressLine = issue.message;
    } else if (first === "address" && second === "city" && !fields.city) {
      fields.city = issue.message;
    }
  }
  return fields;
}

function scheduleHideSuccess(): void {
  if (successTimer) clearTimeout(successTimer);
  successTimer = setTimeout(() => {
    successMessage.value = null;
  }, 4500);
}

async function save(): Promise<void> {
  submitError.value = null;
  successMessage.value = null;
  if (!profile.value || savePending.value) return;
  if (!isDirty.value) return;
  const parsed = profilePatchSchema.safeParse({
    phone: draftPhone.value,
    address: { line: draftAddressLine.value, city: draftCity.value },
  });
  if (!parsed.success) {
    fieldErrors.value = mapIssuesToFields(parsed.error.issues);
    return;
  }
  fieldErrors.value = {};
  patchMutation.mutate(parsed.data, {
    onSuccess: (updated) => {
      editing.value = false;
      successMessage.value = `Datos de contacto actualizados. Sincronizado: ${formatUpdatedAt(updated.updated_at)}.`;
      scheduleHideSuccess();
      // La tarjeta volvió a lectura: devuelve el foco al botón de editar.
      void nextTick(() => contactCard.value?.focusEdit());
    },
    onError: (error) => {
      const mapped = toProfilePageError(error);
      submitError.value = {
        message: mapped?.message ?? "Tuvimos un problema. Intenta de nuevo más tarde.",
        correlationId:
          error instanceof ApiError ? error.correlationId : mapped?.correlationId,
      };
    },
  });
}

async function retry(): Promise<void> {
  if (retryCooldown.value > 0 || profileQuery.isFetching.value) return;
  submitError.value = null;
  startRetryCooldown();
  await profileQuery.refetch();
}

/** Lleva un fallo de cuenta al campo o al aviso del modal que corresponda. */
function applyAccountFailure(
  failure: AuthFailure,
  kind: "email" | "password",
): void {
  const setErrors =
    kind === "email"
      ? (v: typeof emailErrors.value) => (emailErrors.value = v)
      : (v: typeof passwordErrors.value) => (passwordErrors.value = v);
  const setServer =
    kind === "email"
      ? (v: typeof emailServerError.value) => (emailServerError.value = v)
      : (v: typeof passwordServerError.value) => (passwordServerError.value = v);
  setErrors({});
  setServer(null);
  if (failure.kind === "validation") {
    setErrors({ ...(failure.fields ?? {}) });
    return;
  }
  if (failure.kind === "incorrect-password") {
    setErrors({ currentPassword: failure.message });
    return;
  }
  if (failure.kind === "rate-limited") {
    return;
  }
  setServer({
    title: failure.kind === "email-conflict" ? "No pudimos cambiar el correo" : "No pudimos continuar",
    message: failure.message,
    correlationId: failure.correlationId,
  });
}

async function handleSessionExpired(failure: AuthFailure): Promise<void> {
  auth.clearSession(failure);
  await navigateTo("/iniciar-sesion");
}

function openEmailModal(): void {
  if (!profile.value) return;
  emailNew.value = "";
  emailPassword.value = "";
  emailErrors.value = {};
  emailFailure.value = null;
  emailServerError.value = null;
  submitError.value = null;
  successMessage.value = null;
  emailModalOpen.value = true;
}

function closeEmailModal(): void {
  emailModalOpen.value = false;
  void nextTick(() => accountCard.value?.focusAction());
}

async function submitEmailChange(): Promise<void> {
  emailErrors.value = {};
  emailServerError.value = null;
  emailFailure.value = null;
  if (emailPending.value) return;
  const token = auth.accessToken;
  if (!token) {
    await handleSessionExpired({
      kind: "session-expired",
      message: "Tu sesión terminó. Vuelve a entrar.",
    });
    return;
  }
  emailPending.value = true;
  try {
    const result = await changeEmail(
      {
        newEmail: emailNew.value,
        currentPassword: emailPassword.value,
      },
      token,
    );
    if (!result.changed) {
      emailModalOpen.value = false;
      successMessage.value = "Ese ya es tu correo registrado. No hubo cambios.";
      scheduleHideSuccess();
      void nextTick(() => accountCard.value?.focusAction());
      return;
    }
    await auth.refreshUser();
    emailModalOpen.value = false;
    successMessage.value =
      "Correo actualizado. Ya visible en tu cuenta y en Mi Perfil.";
    scheduleHideSuccess();
    void nextTick(() => accountCard.value?.focusAction());
  } catch (error) {
    const failure = error instanceof AuthError ? error.failure : failureFromUnknown(error);
    emailFailure.value = failure;
    if (failure.kind === "session-expired") {
      emailModalOpen.value = false;
      await handleSessionExpired(failure);
      return;
    }
    applyAccountFailure(failure, "email");
  } finally {
    emailPending.value = false;
  }
}

function openPasswordModal(): void {
  passwordCurrent.value = "";
  passwordNext.value = "";
  passwordConfirm.value = "";
  passwordErrors.value = {};
  passwordFailure.value = null;
  passwordServerError.value = null;
  submitError.value = null;
  successMessage.value = null;
  passwordModalOpen.value = true;
}

function closePasswordModal(): void {
  passwordModalOpen.value = false;
  void nextTick(() => securityCard.value?.focusAction());
}

async function submitPasswordChange(): Promise<void> {
  passwordErrors.value = {};
  passwordServerError.value = null;
  passwordFailure.value = null;
  if (passwordPending.value) return;
  const token = auth.accessToken;
  if (!token) {
    await handleSessionExpired({
      kind: "session-expired",
      message: "Tu sesión terminó. Vuelve a entrar.",
    });
    return;
  }
  passwordPending.value = true;
  try {
    await changePassword(
      {
        currentPassword: passwordCurrent.value,
        newPassword: passwordNext.value,
        confirmNewPassword: passwordConfirm.value,
      },
      token,
    );
    // Rotación silenciosa: la familia actual sobrevive, las demás murieron.
    void auth.refreshNow();
    passwordModalOpen.value = false;
    successMessage.value =
      "Contraseña actualizada. Tu sesión sigue activa en este equipo.";
    scheduleHideSuccess();
    void nextTick(() => securityCard.value?.focusAction());
  } catch (error) {
    const failure = error instanceof AuthError ? error.failure : failureFromUnknown(error);
    passwordFailure.value = failure;
    if (failure.kind === "session-expired") {
      passwordModalOpen.value = false;
      await handleSessionExpired(failure);
      return;
    }
    applyAccountFailure(failure, "password");
  } finally {
    passwordPending.value = false;
  }
}

onUnmounted(() => {
  if (successTimer) clearTimeout(successTimer);
});

useSeoMeta({
  title: "Mi Perfil - Kenko EPS",
  description: "Consulta y actualiza tus datos de contacto registrados en Kenko EPS.",
});

useHead({
  htmlAttrs: { lang: "es" },
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <!-- Miga de pan: única vía de regreso al inicio -->
      <nav aria-label="Miga de pan" class="bg-white rounded-2xl border border-zinc-200/80 shadow-sm px-4 sm:px-5">
        <ol class="flex items-center gap-2 font-body text-base min-h-[56px]">
          <li>
            <NuxtLink
              to="/home-page"
              class="inline-flex items-center gap-2 min-h-[48px] px-2 text-accent text-lg font-bold hover:underline rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path
                  d="M15 6l-6 6 6 6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Inicio
            </NuxtLink>
          </li>
          <li aria-hidden="true" class="text-zinc-400 text-xl font-light">/</li>
          <li aria-current="page" class="text-zinc-800 text-lg font-semibold px-2">
            Mi Perfil
          </li>
        </ol>
      </nav>

      <form novalidate @submit.prevent="save">
        <!-- Encabezado: banner de identidad (sin acciones; la edición vive en su tarjeta) -->
        <section
          aria-labelledby="profile-title"
          class="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5"
        >
          <div class="flex flex-col gap-3">
            <div>
              <h1 id="profile-title" class="font-display text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
                Mi Perfil
              </h1>
              <p class="font-body text-sm sm:text-base text-zinc-600 mt-1.5 leading-relaxed">
                Consulta tus datos registrados y actualiza tu teléfono o dirección.
              </p>
            </div>
            <div v-if="profile" class="flex items-center gap-3">
              <div
                aria-hidden="true"
                class="w-12 h-12 rounded-full bg-primary text-on-primary font-display font-bold flex items-center justify-center shrink-0"
              >
                {{ initials }}
              </div>
              <div class="flex flex-col gap-0.5">
                <p class="font-display text-base font-bold text-content leading-tight">
                  {{ formatFullName(profile.first_name, profile.last_name) }}
                </p>
                <p class="font-body text-xs text-zinc-500">
                  {{ formatDocument(profile.document_type, profile.document_number) }}
                </p>
                <p class="font-body text-xs text-zinc-500">
                  <span class="break-all">{{ displayEmail }}</span>
                </p>
              </div>
            </div>
            <div v-else-if="isLoading" role="status" class="flex items-center gap-3 animate-pulse">
              <span class="sr-only">Cargando identidad…</span>
              <div class="w-12 h-12 rounded-full bg-zinc-100" />
              <div class="flex flex-col gap-1.5">
                <div class="h-4 w-44 bg-zinc-100 rounded" />
                <div class="h-3 w-32 bg-zinc-100 rounded" />
              </div>
            </div>
          </div>
          <div
            v-if="profile"
            class="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-1 rounded-xl bg-zinc-50 border border-zinc-200/60 px-4 py-3 shrink-0"
          >
            <p class="font-body text-[11px] uppercase tracking-wide text-zinc-500 font-bold">
              Última sincronización
            </p>
            <p class="font-body text-sm text-content font-semibold">
              {{ formatUpdatedAt(profile.updated_at) }}
            </p>
          </div>
        </section>

        <div class="flex flex-col gap-6 mt-6">
          <!-- Éxito transitorio -->
          <ProfileAlert
            v-if="successMessage"
            variant="success"
            title="Cambios guardados"
            :message="successMessage"
          />

          <!-- Error de envío PATCH -->
          <ProfileAlert
            v-if="submitError"
            variant="error"
            title="No pudimos guardar"
            :message="submitError.message"
            :correlation-id="submitError.correlationId"
          />

          <!-- Cargando -->
          <div v-if="isLoading" role="status" class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
            <span class="sr-only">Cargando tu perfil…</span>
            <div class="bg-white rounded-2xl border border-zinc-200/80 p-6 h-72 flex flex-col gap-3">
              <div class="h-6 bg-zinc-100 rounded w-2/5" />
              <div class="h-12 bg-zinc-100 rounded-xl" />
              <div class="h-12 bg-zinc-100 rounded-xl" />
              <div class="h-12 bg-zinc-100 rounded-xl" />
            </div>
            <div class="bg-white rounded-2xl border border-zinc-200/80 p-6 h-72 flex flex-col gap-3">
              <div class="h-6 bg-zinc-100 rounded w-2/5" />
              <div class="h-12 bg-zinc-100 rounded-xl" />
              <div class="h-12 bg-zinc-100 rounded-xl" />
              <div class="h-12 bg-zinc-100 rounded-xl" />
            </div>
          </div>

          <!-- Sin sesión (la guarda redirige; mensaje de respaldo) -->
          <ProfileAlert
            v-else-if="needsLogin"
            variant="info"
            title="Inicia sesión"
            message="Entra a tu cuenta para ver tu perfil."
          />

          <!-- 404 SQS: perfil en creación -->
          <ProfileStatePanel
            v-else-if="isNotFound"
            variant="not-found"
            title="Tu perfil se está creando"
            :message="`${queryError?.message ?? ''} Si acabas de registrarte, espera unos segundos y reintenta.`"
            :correlation-id="queryError?.correlationId"
            :pending="profileQuery.isFetching.value"
            :cooldown-seconds="retryCooldown"
            @retry="retry"
          />

          <!-- Otros errores de lectura -->
          <ProfileStatePanel
            v-else-if="queryError"
            variant="error"
            title="No pudimos cargar tu perfil"
            :message="queryError.message"
            :correlation-id="queryError.correlationId"
            :pending="profileQuery.isFetching.value"
            :cooldown-seconds="retryCooldown"
            @retry="retry"
          />

          <!-- Contenido -->
          <template v-else-if="profile">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <ProfilePersonalCard :profile="profile" />
              <ProfileContactCard
                ref="contactCard"
                :profile="profile"
                :editing="editing"
                :phone="draftPhone"
                :address-line="draftAddressLine"
                :city="draftCity"
                :errors="fieldErrors"
                :pending="savePending"
                :can-save="isDirty && !savePending"
                @update:phone="onPhoneInput"
                @update:address-line="draftAddressLine = $event"
                @update:city="draftCity = $event"
                @edit="startEdit"
                @cancel="cancelEdit"
              />
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <ProfileAccountCard
                ref="accountCard"
                :profile="profile"
                :email="displayEmail"
                @change-email="openEmailModal"
              />
              <ProfileSecurityCard
                ref="securityCard"
                @change-password="openPasswordModal"
              />
            </div>
          </template>
        </div>
      </form>

      <!-- Modales de cuenta (fuera del form de contacto: cada uno trae el suyo) -->
      <ProfileEmailModal
        :open="emailModalOpen"
        :pending="emailPending"
        :current-email="displayEmail"
        :new-email="emailNew"
        :current-password="emailPassword"
        :errors="emailErrors"
        :server-error="emailServerError"
        :rate-seconds="emailCountdown"
        @update:new-email="emailNew = $event"
        @update:current-password="emailPassword = $event"
        @submit="submitEmailChange"
        @close="closeEmailModal"
      />
      <ProfilePasswordModal
        :open="passwordModalOpen"
        :pending="passwordPending"
        :current-password="passwordCurrent"
        :new-password="passwordNext"
        :confirm-new-password="passwordConfirm"
        :errors="passwordErrors"
        :server-error="passwordServerError"
        :rate-seconds="passwordCountdown"
        @update:current-password="passwordCurrent = $event"
        @update:new-password="passwordNext = $event"
        @update:confirm-new-password="passwordConfirm = $event"
        @submit="submitPasswordChange"
        @close="closePasswordModal"
      />

      <!-- Confirmar descarte -->
      <div
        v-if="showDiscard"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-title"
        @keydown.escape="keepEditing"
      >
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
          <h2 id="discard-title" class="font-display text-lg font-bold text-content">
            ¿Descartar cambios?
          </h2>
          <p class="font-body text-sm text-zinc-600">
            Tienes cambios sin guardar. Si sales, se restauran los valores registrados.
          </p>
          <div class="flex items-center justify-end gap-2.5">
            <button
              ref="discardKeepButton"
              class="px-4 min-h-[44px] rounded-xl text-content font-display text-sm font-bold hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
              type="button"
              @click="keepEditing"
            >
              Seguir editando
            </button>
            <button
              class="px-4 min-h-[44px] rounded-xl bg-[#ba1a1a] text-white font-display text-sm font-bold focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
              type="button"
              @click="confirmDiscard"
            >
              Sí, descartar
            </button>
          </div>
        </div>
      </div>

      <!-- Toast de éxito -->
      <div
        v-if="successMessage"
        role="status"
        class="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 p-4 rounded-xl shadow-lg bg-primary text-on-primary font-body text-sm flex items-start gap-2.5"
      >
        <span class="flex-1">{{ successMessage }}</span>
        <button
          type="button"
          aria-label="Cerrar aviso"
          class="p-1 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer"
          @click="successMessage = null"
        >
          Cerrar
        </button>
      </div>
    </main>
  </div>
</template>
