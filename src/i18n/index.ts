import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

type TranslationNamespace = Record<string, unknown>
type TranslationResources = Record<string, Record<string, TranslationNamespace>>

const namespaces = [
  'common',
  'auth',
  'pages',
  'upload',
  'importYoutube',
  'video',
  'components',
  'settings',
  'blossom',
  'feedback',
  'zap',
  'videoMetrics',
]

const translationModules = import.meta.glob('./*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, TranslationNamespace>

const resources = Object.entries(translationModules).reduce<TranslationResources>((acc, [path, translations]) => {
  const match = /^\.\/([^/]+)\/([^/]+)\.json$/.exec(path)

  if (!match) return acc

  const [, language, namespace] = match
  acc[language] ??= {}
  acc[language][namespace] = translations

  return acc
}, {})

export default i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    ns: namespaces,
    defaultNS: 'common',
    fallbackNS: namespaces.filter((namespace) => namespace !== 'common'),

    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })
