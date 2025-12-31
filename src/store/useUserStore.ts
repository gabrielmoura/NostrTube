import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { NDKUserProfile } from "@nostr-dev-kit/ndk-hooks";
import { AgeEnum } from "@/store/store/sessionTypes";

// --- Interfaces de Estado (Apenas Dados) ---

interface BlossomState {
  mirrors: string[];
  default: string;
}

export interface ConfigData {
  darkTheme: boolean;
  nsfw: boolean;
  age?: AgeEnum;
  relays?: string[];
  geoHash?: string;
  pushNotificationsEnabled?: boolean;
}

interface UserState {
  profile: Partial<NDKUserProfile> | null;
  config: ConfigData;
  blossom: BlossomState;
}

// --- Interfaces de Ações (Funções) ---

interface UserActions {
  // Session/Profile
  setProfile: (profile: NDKUserProfile) => void;
  clearSession: () => void;

  // Config
  toggleTheme: () => void;
  setNsfw: (enabled: boolean) => void;
  setRelays: (relays: string[]) => void;
  setGeoHash: (geoHash: string) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setAge: (age: AgeEnum) => void;

  // Blossom
  setBlossomMirrors: (mirrors: string[]) => void;
  setBlossomDefault: (url: string) => void;
}

export type UserStore = UserState & UserActions;

// --- Configuração Inicial ---

const STORE_NAME = "user-session";

const initialState: UserState = {
  profile: null,
  config: {
    darkTheme: false,
    nsfw: false,
    relays: [],
    pushNotificationsEnabled: false,
  },
  blossom: {
    mirrors: [],
    default: "",
  },
};

// --- Store ---

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        // Actions: Profile
        setProfile: (profile) =>
          set((state) => { state.profile = profile; }, false, "user/setProfile"),

        clearSession: () =>
          set((state) => {
            state.profile = initialState.profile;
            state.config = initialState.config;
            state.blossom = initialState.blossom;
          }, false, "user/clearSession"),

        // Actions: Config
        toggleTheme: () =>
          set((state) => { state.config.darkTheme = !state.config.darkTheme; }, false, "config/toggleTheme"),

        setNsfw: (enabled) =>
          set((state) => { state.config.nsfw = enabled; }, false, "config/setNsfw"),

        setRelays: (relays) =>
          set((state) => { state.config.relays = relays; }, false, "config/setRelays"),

        setGeoHash: (geoHash) =>
          set((state) => { state.config.geoHash = geoHash; }, false, "config/setGeoHash"),

        setPushNotificationsEnabled: (enabled) =>
          set((state) => { state.config.pushNotificationsEnabled = enabled; }, false, "config/setPushNotifications"),

        setAge: (age) =>
          set((state) => { state.config.age = age; }, false, "config/setAge"),

        // Actions: Blossom
        setBlossomMirrors: (mirrors) =>
          set((state) => { state.blossom.mirrors = mirrors; }, false, "blossom/setMirrors"),

        setBlossomDefault: (url) =>
          set((state) => { state.blossom.default = url; }, false, "blossom/setDefault"),
      })),
      {
        name: STORE_NAME,
        storage: createJSONStorage(() => localStorage),
        // Partialize garante que apenas os dados (não as funções) sejam salvos
        partialize: (state) => ({
          profile: state.profile,
          config: state.config,
          blossom: state.blossom,
        }),
      }
    ),
    {
      name: STORE_NAME,
      enabled: import.meta.env.DEV,
    }
  )
);

export default useUserStore;