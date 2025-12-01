import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { NDKUserProfile } from "@nostr-dev-kit/ndk-hooks";
import { AgeEnum } from "@/store/store/sessionTypes"; // Ajuste o import conforme seu projeto

// --- Tipos ---

interface BlossomConfig {
  mirrors: string[];
  default: string;
}

interface BlossomAction {
  setMirrors: (mirrors: string[]) => void;
  setDefault: (url: string) => void;
}

export interface SessionData {
  profile: NDKUserProfile;
  darkTheme: boolean;
  nsfw: boolean;
  age?: AgeEnum;
  relays?: string[];
  geoHash?: string;
  pushNotificationsEnabled?: boolean;
}

interface UserState {
  session?: SessionData;
  blossom: BlossomConfig & BlossomAction;
}

interface UserActions {
  clearSession: () => void;
  setProfile: (profile: NDKUserProfile) => void;
  toggleTheme: () => void;
  setNsfw: (enabled: boolean) => void;
  setRelays: (r: string[]) => void;
  setGeoHash: (geoHash: string) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setAge: (age: AgeEnum) => void;
}

export type UserStore = UserState & UserActions;

// --- Configuração ---

const STORE_NAME = "user-session";

// --- Store ---

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        session: undefined,
        clearSession: () =>
          set(
            (state) => {
              state.session = undefined;
            },
            false,
            "clearSession"
          ),

        setProfile: (profile) =>
          set(
            (state) => {
              if (state.session) {
                // Se já existe sessão, atualiza apenas o perfil
                state.session.profile = profile;
              } else {
                // Se não existe, inicializa com padrões
                state.session = {
                  profile,
                  darkTheme: false,
                  nsfw: false,
                  age: undefined

                };
              }
            },
            false,
            "setProfile"
          ),

        toggleTheme: () =>
          set(
            (state) => {
              if (state.session) {
                state.session.darkTheme = !state.session.darkTheme;
              }
            },
            false,
            "toggleTheme"
          ),

        setNsfw: (enabled) =>
          set(
            (state) => {
              if (state.session) {
                state.session.nsfw = enabled;
              }
            },
            false,
            "setNsfw"
          ),

        setPushNotificationsEnabled: (enabled) =>
          set(
            (state) => {
              if (state.session) {
                state.session.pushNotificationsEnabled = enabled;
              }
            },
            false,
            "setPushNotificationsEnabled"
          ),

        setGeoHash: (geoHash) =>
          set(
            (state) => {
              if (state.session) {
                state.session.geoHash = geoHash;
              }
            },
            false,
            "setGeoHash"
          ),

        setAge: (age) =>
          set(
            (state) => {
              if (state.session) {
                state.session.age = age;
              }
            },
            false,
            "setGeoHash"
          ),

        setRelays: (relays) => set((state) => {
          if (state.session) {
            state.session.relays = relays;

          }
        }, false, "setRelays"),
        blossom: {
          mirrors: [],
          default: "",

          setMirrors: (mirrors) =>
            set(
              (state) => {
                state.blossom.mirrors = mirrors;
              },
              false,
              "blossom/setMirrors"
            ),

          setDefault: (url) =>
            set(
              (state) => {
                state.blossom.default = url;
              },
              false,
              "blossom/setDefault"
            )
        }
      })),
      {
        name: STORE_NAME,
        storage: createJSONStorage(() => sessionStorage) // Use localStorage se necessário
        // Opcional: partialize para salvar apenas dados específicos se a store crescer
        // partialize: (state) => ({ session: state.session }),
      }
    ),
    {
      name: STORE_NAME,
      enabled: import.meta.env.DEV
    }
  )
);

export default useUserStore;