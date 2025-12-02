// components/profile/FollowButton.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NDKUser } from "@nostr-dev-kit/ndk";


interface FollowButtonProps {
  pubkey?: string;
  currentUser?: NDKUser; // O usuário logado
}

export function FollowButton({ pubkey, currentUser }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser && pubkey) {
      // Verifica se o usuário logado segue o perfil atual (simplificado)
      // Em produção, verificar o Kind 3 do currentUser
      const checkFollow = async () => {
        const follows = await currentUser.follows();
        setIsFollowing(follows.has(pubkey));
      };
      checkFollow();
    }
  }, [currentUser, pubkey]);

  const toggleFollow = async () => {
    if (!currentUser) return; // Trigger login modal here ideally
    setLoading(true);
    try {
      const targetUser = new NDKUser({ pubkey });
      if (isFollowing) {
        await currentUser.unfollow(targetUser);
        setIsFollowing(false);
      } else {
        await currentUser.follow(targetUser);
        setIsFollowing(true);
      }
    } catch (e) {
      console.error("Erro ao seguir/deixar de seguir", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={toggleFollow}
      disabled={loading || !currentUser}
      variant={isFollowing ? "outline" : "default"}
      className="rounded-full px-6"
    >
      {loading ? "Processando..." : isFollowing ? "Seguindo" : "Seguir"}
    </Button>
  );
}