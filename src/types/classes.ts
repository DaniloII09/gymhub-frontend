export interface GymClassTrainer {
  id: string;
  fullName: string;
  email: string;
}

export type ClassStatus = "SCHEDULED" | "CANCELLED";

export interface GymClass {
  id: number;
  name: string;
  trainerId: string;
  trainer: GymClassTrainer;
  startsAt: string;
  endsAt: string;
  capacity: number;
  confirmedReservations: number;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassInput {
  name: string;
  trainerId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
}

export interface UpdateClassInput {
  name?: string;
  trainerId?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
}

export interface TrainerOption {
  id: string;
  fullName: string;
  email: string;
}

export interface ClassServiceResult<T = GymClass> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

