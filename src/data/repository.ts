import { MemoryRepository } from "./memoryRepository";
import { createSupabaseRepository } from "./supabaseRepository";

/**
 * `VITE_DATA_BACKEND=supabase` is the future switch. It is intentionally not
 * wired to a live project in this version.
 */
export function createRepository(): MemoryRepository {
  if (import.meta.env.VITE_DATA_BACKEND === "supabase") {
    createSupabaseRepository();
  }
  return new MemoryRepository();
}

export type { MemoryRepository };
