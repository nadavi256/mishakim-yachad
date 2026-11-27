import { MemoryRepository } from "./memoryRepository";

/**
 * Activities stay on the in-memory mock until a later milestone.
 * Google sign-in uses VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY when both are set,
 * and does not replace this store. With the vars missing, the Pages demo is unchanged.
 */
export function createRepository(): MemoryRepository {
  return new MemoryRepository();
}

export type { MemoryRepository };
