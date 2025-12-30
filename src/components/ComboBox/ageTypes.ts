import { AgeEnum } from "@/store/store/sessionTypes.ts";
import { t } from "i18next";

export type AgeOption = {
  id: AgeEnum;
  label: string;
  description: string;
};

// OCP: Se o enum crescer, a lógica do componente permanece intacta.
export const getAgeOptions = (): AgeOption[] => [
  {
    id: AgeEnum.kids,
    label: t("age.options.kids.label", "Kids"),
    description: t("age.options.kids.desc", "Conteúdo infantil")
  },
  {
    id: AgeEnum.teen,
    label: t("age.options.teen.label", "Teen"),
    description: t("age.options.teen.desc", "Conteúdo juvenil")
  },
  {
    id: AgeEnum.adult,
    label: t("age.options.adult.label", "Adult"),
    description: t("age.options.adult.desc", "Conteúdo adulto")
  },
  {
    id: AgeEnum.porn,
    label: t("age.options.porn.label", "NSFW"),
    description: t("age.options.porn.desc", "Conteúdo explícito")
  }
];