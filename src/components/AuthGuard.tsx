import { Outlet, type Redirect, useNavigate } from "@tanstack/react-router";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { type ComponentType, useEffect } from "react";
import { toast } from "sonner";
import { t } from "i18next";

/**
 * Componente de guarda de rota baseado em Layout.
 * * Verifica se existe um usuário autenticado via NDK. Caso não esteja logado,
 * redireciona o usuário para a página inicial e exibe um alerta.
 * * @component
 * @example
 * ```tsx
 * // No arquivo de rotas:
 * const protectedRoute = new Route({
 * getParentRoute: () => rootRoute,
 * path: 'upload',
 * component: AuthGuard, // Todas as rotas filhas estarão protegidas
 * })
 * ```
 * * @returns {JSX.Element} O componente `Outlet` para renderizar as rotas filhas se autenticado.
 * @throws {Redirect} Realiza um redirecionamento imperativo via `Maps` se `currentUser` for nulo.
 */
export function AuthGuard() {
  const navigate = useNavigate();
  const currentUser = useNDKCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/" }).then(() =>
        toast.warning(t("auth_required", "You must be logged in to upload videos"))
      );
    }
  }, [currentUser, navigate]);
  return <Outlet />;
}

/**
 * Higher-Order Component (HOC) para proteção de autenticação Nostr.
 * * Envolve um componente e garante que ele só seja renderizado se o usuário
 * estiver autenticado. Gerencia automaticamente o redirecionamento e notificações.
 * * @template P - Tipo das propriedades do componente original.
 * @param {React.ComponentType<P>} WrappedComponent - O componente que deseja proteger.
 * * @returns {React.FC<P>} Um novo componente funcional protegido.
 * * @example
 * ```tsx
 * const UserSettings = (props: Props) => <div>Configurações</div>;
 * export default withAuth(UserSettings);
 * ```
 * * @remarks
 * - Se o usuário não estiver logado, o componente retorna `null` para evitar "flashes" de conteúdo privado.
 * - Dispara um `toast.warning` traduzido via `i18next`.
 * - Preserva o `displayName` para facilitar a depuração no React DevTools.
 */
export function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const ComponentWithAuth = (props: P) => {
    const navigate = useNavigate();
    const currentUser = useNDKCurrentUser();

    useEffect(() => {
      if (!currentUser) {
        navigate({ to: "/" }).then(() =>
          toast.warning(t("auth_required", "You must be logged in to access this page"))
        );
      }
    }, [currentUser, navigate]);

    // Enquanto redireciona, não renderizamos nada (ou poderíamos retornar um loader)
    if (!currentUser) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  // Define um nome amigável para debug no DevTools
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  ComponentWithAuth.displayName = `withAuth(${displayName})`;

  return ComponentWithAuth;
}