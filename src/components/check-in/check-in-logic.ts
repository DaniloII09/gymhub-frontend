import { formatEndDate, GYM_TIME_ZONE, STATUS_LABELS } from "@/src/types/membership";
import type { CheckInMember, CheckInResult } from "@/src/types/check-ins";

// Reglas de la pantalla de check-in (FE-13.1, FE-14.1).

export const MIN_LOOKUP_LENGTH = 2;
export const LOOKUP_DEBOUNCE_MS = 400;
export const EXCEPTION_REASON_MIN_LENGTH = 5;
export const EXCEPTION_REASON_MAX_LENGTH = 200;

export const NO_MEMBERS_FOUND_MESSAGE = "No encontramos miembros con ese dato.";
export const RECENT_CHECK_IN_MESSAGE = "Este miembro ya registró su ingreso hace menos de 30 minutos.";
export const MEMBERSHIP_NOT_CURRENT_ALERT = "Membresía no vigente";
export const NO_NEXT_PAYMENT_DATE_LABEL = "Sin fecha";
export const MISSING_EXCEPTION_REASON_MESSAGE = "Escribe el motivo para dejarlo pasar.";
export const EXCEPTION_REASON_LENGTH_MESSAGE = `El motivo debe tener entre ${EXCEPTION_REASON_MIN_LENGTH} y ${EXCEPTION_REASON_MAX_LENGTH} caracteres.`;

/** ¿Hay que buscar con lo escrito? Con menos de 2 caracteres, no. */
export function shouldLookup(term: string): boolean {
  return term.trim().length >= MIN_LOOKUP_LENGTH;
}

/** Hora del ingreso en El Salvador, HH:MM. */
export function formatCheckInTime(iso: string): string {
  return new Intl.DateTimeFormat("es-SV", {
    timeZone: GYM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function checkInSuccessMessage(checkedInAt: string, isException = false): string {
  const time = formatCheckInTime(checkedInAt);
  return isException
    ? `Ingreso excepcional registrado a las ${time}.`
    : `Ingreso registrado a las ${time}.`;
}

export function statusLabel(member: Pick<CheckInMember, "membershipStatus">): string {
  return STATUS_LABELS[member.membershipStatus];
}

/** "15/12/2026", o "Sin fecha" si no tiene membresía. */
export function nextPaymentLabel(member: Pick<CheckInMember, "nextPaymentDate">): string {
  return member.nextPaymentDate ? formatEndDate(member.nextPaymentDate) : NO_NEXT_PAYMENT_DATE_LABEL;
}

/** La vigencia para ingresar viene resuelta por el backend en `accessAllowed`. */
export function isMembershipCurrent(member: Pick<CheckInMember, "accessAllowed">): boolean {
  return member.accessAllowed;
}

/**
 * Valida el motivo de excepción (5 a 200 caracteres tras recortar espacios),
 * alineado con BE-14.1. Devuelve null si es válido.
 */
export function validateExceptionReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length === 0) return MISSING_EXCEPTION_REASON_MESSAGE;
  if (
    trimmed.length < EXCEPTION_REASON_MIN_LENGTH ||
    trimmed.length > EXCEPTION_REASON_MAX_LENGTH
  ) {
    return EXCEPTION_REASON_LENGTH_MESSAGE;
  }
  return null;
}

export type CheckInSubmission =
  | { ok: true; memberId: string; exceptionReason?: string }
  | { ok: false; reasonError: string };

/** Prepara el envío según `accessAllowed`: exige motivo válido solo si no tiene acceso vigente. */
export function prepareCheckInSubmission(
  member: Pick<CheckInMember, "memberId" | "accessAllowed">,
  exceptionReason: string,
): CheckInSubmission {
  if (member.accessAllowed) {
    return { ok: true, memberId: member.memberId };
  }
  const reasonError = validateExceptionReason(exceptionReason);
  if (reasonError) {
    return { ok: false, reasonError };
  }
  return {
    ok: true,
    memberId: member.memberId,
    exceptionReason: exceptionReason.trim(),
  };
}

export type CheckInScreenState = {
  term: string;
  results: CheckInMember[];
  searching: boolean;
  searchError: string | null;
  selected: CheckInMember | null;
  exceptionReason: string;
  reasonError: string | null;
  registering: boolean;
  success: string | null;
  error: string | null;
};

export const INITIAL_CHECK_IN_STATE: CheckInScreenState = {
  term: "",
  results: [],
  searching: false,
  searchError: null,
  selected: null,
  exceptionReason: "",
  reasonError: null,
  registering: false,
  success: null,
  error: null,
};

/** Limpia selección, motivo de excepción y errores previos al cambiar la búsqueda. */
export function applyTermChange(state: CheckInScreenState, term: string): CheckInScreenState {
  return {
    ...state,
    term,
    selected: null,
    results: [],
    searching: false,
    searchError: null,
    exceptionReason: "",
    reasonError: null,
    success: null,
    error: null,
  };
}

/** Al elegir otro miembro limpia cualquier motivo y error anterior. */
export function applySelectMember(
  state: CheckInScreenState,
  member: CheckInMember,
): CheckInScreenState {
  return {
    ...state,
    selected: member,
    exceptionReason: "",
    reasonError: null,
    success: null,
    error: null,
  };
}

export function applyExceptionReasonChange(
  state: CheckInScreenState,
  exceptionReason: string,
): CheckInScreenState {
  return {
    ...state,
    exceptionReason,
    reasonError: null,
    error: null,
  };
}

export function applyCheckInSuccess(
  state: CheckInScreenState,
  result: CheckInResult,
): CheckInScreenState {
  return {
    ...state,
    term: "",
    results: [],
    selected: null,
    exceptionReason: "",
    reasonError: null,
    registering: false,
    error: null,
    success: checkInSuccessMessage(result.checkedInAt, result.isException),
  };
}

export function applyCheckInFailure(
  state: CheckInScreenState,
  error: string,
): CheckInScreenState {
  return {
    ...state,
    registering: false,
    error,
  };
}
