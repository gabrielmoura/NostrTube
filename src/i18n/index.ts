import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

import ptCommon from "./pt/common.json";
// import ptErrors from "./pt/errors.json";
import enCommon from "./en/common.json";
// import enErrors from "./en/errors.json";
import ruCommon from "./ru/common.json";
import esCommon from "./es/common.json";

export default i18n
  .use(Backend)            // backend HTTP
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": {
        common: ptCommon
        // errors: ptErrors
      },
      en: {
        common: enCommon
        // errors: enErrors
      },
      ru: {
        common: ruCommon
        // errors: enErrors
      },
      es: {
        common: esCommon
        // errors: enErrors
      }

    },

    // lng: "pt-BR",
    fallbackLng: "en",

    ns: ["common", "errors"],
    defaultNS: "common",

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json"
    },

    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"]
    }
  });


