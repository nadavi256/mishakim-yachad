import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createRepository, type MemoryRepository } from "./repository";
import { CURRENT_USER_ID, type AppState, type Draft, type Profile, type Report } from "./types";

interface Toast {
  id: number;
  text: string;
}

interface StoreValue {
  state: AppState;
  toasts: Toast[];
  toast: (text: string) => void;
  reset: () => void;
  saveDraft: (draft: Draft) => void;
  discardDraft: (id: string) => void;
  publish: MemoryRepository["publish"];
  join: MemoryRepository["join"];
  cancelParticipation: MemoryRepository["cancelParticipation"];
  acceptInvitation: MemoryRepository["acceptInvitation"];
  declineInvitation: MemoryRepository["declineInvitation"];
  toggleSavedProfile: MemoryRepository["toggleSavedProfile"];
  toggleFollow: MemoryRepository["toggleFollow"];
  toggleBookmark: MemoryRepository["toggleBookmark"];
  sendMessage: MemoryRepository["sendMessage"];
  markAllRead: MemoryRepository["markAllRead"];
  cancelActivity: MemoryRepository["cancelActivity"];
  updateProfile: MemoryRepository["updateProfile"];
  report: (input: Omit<Report, "id" | "reporter_id" | "created_at">) => void;
  blockUser: MemoryRepository["blockUser"];
  unblockUser: MemoryRepository["unblockUser"];
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const repoRef = useRef<MemoryRepository | null>(null);
  if (!repoRef.current) repoRef.current = createRepository();
  const repo = repoRef.current;
  const [state, setState] = useState<AppState>(() => repo.getState());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const api = useMemo<StoreValue>(() => {
    const sync = () => setState(repo.getState());
    const toast = (text: string) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, text }]);
      window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2800);
    };
    return {
      state,
      toasts,
      toast,
      reset: () => {
        repo.reset();
        sync();
        toast("הנתונים אופסו");
      },
      saveDraft: (draft) => {
        repo.saveDraft(draft);
        sync();
      },
      discardDraft: (id) => {
        repo.discardDraft(id);
        sync();
      },
      publish: (draft, key, now) => {
        const result = repo.publish(draft, key, now);
        sync();
        return result;
      },
      join: (activityId, message, now) => {
        const result = repo.join(activityId, message, now);
        sync();
        return result;
      },
      cancelParticipation: (activityId, now) => {
        const result = repo.cancelParticipation(activityId, now);
        sync();
        return result;
      },
      acceptInvitation: (id, now) => {
        const result = repo.acceptInvitation(id, now);
        sync();
        return result;
      },
      declineInvitation: (id) => {
        repo.declineInvitation(id);
        sync();
      },
      toggleSavedProfile: (id) => {
        repo.toggleSavedProfile(id);
        sync();
      },
      toggleFollow: (id) => {
        repo.toggleFollow(id);
        sync();
      },
      toggleBookmark: (id) => {
        repo.toggleBookmark(id);
        sync();
      },
      sendMessage: (activityId, body, now) => {
        const result = repo.sendMessage(activityId, body, now);
        sync();
        return result;
      },
      markAllRead: (now) => {
        repo.markAllRead(now);
        sync();
      },
      cancelActivity: (id) => {
        const result = repo.cancelActivity(id);
        sync();
        return result;
      },
      updateProfile: (patch: Pick<Profile, "display_name" | "bio" | "general_area" | "sports">) => {
        repo.updateProfile(patch);
        sync();
      },
      report: (input) => {
        repo.report(input);
        sync();
        toast("הדיווח נשמר בהדגמה");
      },
      blockUser: (id) => {
        repo.blockUser(id);
        sync();
        toast("המשתמש נחסם בהדגמה");
      },
      unblockUser: (id) => {
        repo.unblockUser(id);
        sync();
      },
    };
  }, [repo, state, toasts]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore מחוץ לספק");
  return ctx;
}

export function useMe() {
  const { state } = useStore();
  const me = state.profiles.find((p) => p.user_id === CURRENT_USER_ID);
  if (!me) throw new Error("missing current profile");
  return me;
}
