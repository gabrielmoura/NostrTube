import { Link } from "@tanstack/react-router"; // Assumindo que você está usando TanStack Router
import { useNDKCurrentPubkey, useNDKSessionLogout } from "@nostr-dev-kit/ndk-hooks";
import useUserStore from "@/store/useUserStore.ts";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"; // Caminho para os componentes shadcn/ui
import { Button } from "@/components/ui/button"; // Adicionado para um botão de trigger shadcn/ui
import { ChevronDownIcon } from "@radix-ui/react-icons"; // Exemplo de ícone, ajuste conforme necessário

function ProfileMenuHeader() {
  const logout = useNDKSessionLogout();
  const clanSession = useUserStore((s) => s.clearSession);
  const currentPubkey = useNDKCurrentPubkey();

  function handleLogout() {
    logout();
    clanSession(); // Certifique-se de que esta função faz o que é esperado para limpar a sessão
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/*
          Aqui você pode colocar qualquer elemento que irá disparar o menu.
          Pode ser um avatar do usuário, um botão, etc.
          Usamos um Button simples com um ícone como exemplo.
        */}
        <Button variant="ghost" className="flex items-center gap-1">
          {/* Você pode substituir "Seu Nome" ou adicionar um avatar aqui */}

          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/u/$userId" params={{ userId: currentPubkey }}>
            Your Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link to="/configurarion">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator /> {/* Um separador para melhor organização */}
        <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileMenuHeader;