import { type ComponentProps, useEffect, useState } from "react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { type Hexpubkey, NDKUser, useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { UserMinus, UserPlus } from "lucide-react";
import { modal } from "@/components/modal_v2/modal-manager.ts";
import { AuthModal } from "@/components/AuthModal.tsx";

type FollowButtonProps = {
  pubkey: string;
} & ComponentProps<typeof Button>;

export default function FollowButton({
                                       pubkey,
                                       ...buttonProps
                                     }: FollowButtonProps) {
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [follows, setFollows] = useState<Hexpubkey[]>([]);
  const currentUser = useNDKCurrentUser();
  const { ndk } = useNDK();


  useEffect(() => {
    if (currentUser) {
      currentUser.followSet().then(r => setFollows(Array.from(r)));

    }
  }, [currentUser]);


  async function handleFollow() {
    if (!ndk || !currentUser) return;

    setFollowLoading(true);
    try {
      setFollows((f) => [...f, pubkey]);
      await currentUser?.follow(new NDKUser({ hexpubkey: pubkey }));
      toast.success("Following!");
    } catch (err) {
      console.log("Error", err);
    }
    setFollowLoading(false);
  }

  async function handleUnfollow() {
    if (!ndk || !currentUser) return;
    setFollowLoading(true);
    try {
      setFollows((f) => f.filter((i) => i !== pubkey));
      await currentUser?.unfollow(new NDKUser({ hexpubkey: pubkey }));
      toast.success("Unfollowed!");
    } catch (err) {
      console.log("Error", err);
    }
    setFollowLoading(false);
  }

  if (follows.find((i) => i === pubkey)) {
    return (
      <Button
        onClick={() => {
          handleUnfollow().catch(console.warn);
        }}
        isLoading={followLoading}
        variant={"secondary"}
        {...buttonProps}
      >
        <UserMinus />
        <span>Unfollow</span>
      </Button>
    );
  } else {
    return (
      <Button
        onClick={() => {
          if (!currentUser) {
            modal.show(<AuthModal />, { id: "auth" });
          } else {
            handleFollow().catch(console.warn);
          }
        }}
        isLoading={followLoading}
        {...buttonProps}
      >
        <UserPlus />
        <span>Follow</span>
      </Button>
    );
  }
}
