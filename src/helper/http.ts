import { generateUrl, type Options } from "@imgproxy/imgproxy-js-core";

// --- Função de Alto Nível (Helper / Wrapper) ---

/**
 * Função utilitária para uso direto nos componentes.
 * Responsabilidade: Decidir SE deve usar o proxy e aplicar defaults.
 */
export function getOptimizedImageSrc(
  src: string,
  width: number | string,
  customOptions?: Options
): string {
  const envUrl = import.meta.env.VITE_APP_IMGPROXY;

  // 1. Guard Clause: Se não houver URL configurada, retorna a original
  if (!envUrl) {
    return src;
  }
  if (!src){
    return src;
  }

  // 2. Normalização das opções
  // Se nenhuma opção for passada, assumimos o redimensionamento padrão baseado na largura
  const options: Options = customOptions || {
    resize: {
      resizing_type: "fit",
      width: Number(width),
      height: Number(width)
    }
  };

  const path = generateUrl({
    type: "plain",
    value: src
  }, options);

  // 3. Delega a construção da URL
  return `${envUrl}/insecure${path}`;
}