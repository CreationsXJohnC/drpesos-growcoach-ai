import { create } from "zustand";
import { v4 as uuid } from "uuid";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  attachments?: { type: "image"; url: string; name: string }[];
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isOpen: boolean;
  growContext?: { stage?: string; week?: number; strainType?: string };
  addMessage: (role: "user" | "assistant", content: string, attachments?: Message["attachments"]) => string;
  updateMessage: (id: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  setOpen: (open: boolean) => void;
  setGrowContext: (ctx: ChatState["growContext"]) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  isOpen: false,
  growContext: undefined,

  addMessage: (role, content, attachments) => {
    const id = uuid();
    set((state) => ({
      messages: [
        ...state.messages,
        { id, role, content, createdAt: new Date(), attachments },
      ],
    }));
    return id;
  },

  updateMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setOpen: (open) => set({ isOpen: open }),
  setGrowContext: (ctx) => set({ growContext: ctx }),
  clearMessages: () => set({ messages: [] }),
}));
