import { apiFetch } from "@/src/services/http/api-client";
import type {
  ClassServiceResult,
  CreateClassInput,
  GymClass,
  TrainerOption,
  UpdateClassInput,
} from "@/src/types/classes";

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[]; error?: string };
    if (Array.isArray(data.message)) {
      return data.message.join(" ");
    }
    if (typeof data.message === "string") {
      return data.message;
    }
    if (typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Error al parsear JSON, usar fallback por status
  }
  return `Error en la solicitud (${res.status}).`;
}

/**
 * Consulta las clases programadas para una semana dada según el rango [from, to].
 */
export async function fetchWeeklyClasses(
  from: Date,
  to: Date,
): Promise<ClassServiceResult<GymClass[]>> {
  try {
    const query = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });

    const res = await apiFetch(`classes?${query.toString()}`);
    if (!res.ok) {
      const error = await parseErrorMessage(res);
      return { ok: false, error, status: res.status };
    }

    const data = (await res.json()) as GymClass[];
    return { ok: true, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar las clases.";
    return { ok: false, error: message, status: 500 };
  }
}

/**
 * Programa una nueva clase grupal (H06 / SCRUM-74).
 * Si hay conflicto (HTTP 409) o error de validación (HTTP 400), devuelve el mensaje para el formulario.
 */
export async function createClass(
  input: CreateClassInput,
): Promise<ClassServiceResult<GymClass>> {
  try {
    const res = await apiFetch("classes", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const error = await parseErrorMessage(res);
      return { ok: false, error, status: res.status };
    }

    const data = (await res.json()) as GymClass;
    return { ok: true, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al conectar con el servidor.";
    return { ok: false, error: message, status: 500 };
  }
}

/**
 * Edita los datos o cupo de una clase grupal programada (H06 / SCRUM-74).
 * En caso de conflicto HTTP 409 (ej. cupo menor a reservas confirmadas o cruce), conserva el mensaje.
 */
export async function updateClass(
  classId: number,
  input: UpdateClassInput,
): Promise<ClassServiceResult<GymClass>> {
  try {
    const res = await apiFetch(`classes/${classId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const error = await parseErrorMessage(res);
      return { ok: false, error, status: res.status };
    }

    const data = (await res.json()) as GymClass;
    return { ok: true, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al conectar con el servidor.";
    return { ok: false, error: message, status: 500 };
  }
}

/**
 * Obtiene el listado de entrenadores activos disponibles en el sistema.
 */
export async function fetchTrainers(): Promise<TrainerOption[]> {
  try {
    const res = await apiFetch("staff?page=1&pageSize=100");
    if (!res.ok) {
      return [];
    }

    const json = (await res.json()) as {
      data?: Array<{ id: string; fullName: string; email: string; role: string; isActive?: boolean }>;
    };

    if (!json || !Array.isArray(json.data)) {
      return [];
    }

    return json.data
      .filter((u) => u.role === "TRAINER" && u.isActive !== false)
      .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email }));
  } catch {
    return [];
  }
}

