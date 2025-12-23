import { ReactNode } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { nip19 } from "nostr-tools";
import { cn, getTwoLetters } from "@/helper/format.ts";
import { Avatar } from "@radix-ui/themes";
import { useProfileValue } from "@nostr-dev-kit/ndk-hooks";

type HorizontalUsersScrollableProps = {
  title?: string;
  action?: ReactNode;
  className?: string;
  avatarClassname?: string;
  users: string[];
};

export default function HorizontalUsersScrollable({
                                                    title,
                                                    action,
                                                    className,
                                                    avatarClassname,
                                                    users
                                                  }: HorizontalUsersScrollableProps) {
  return (
    <div className={cn("w-full", className)}>
      {!!title && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="py-3">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex w-max space-x-2 p-2">
            {users.map((user) => (
              <figure key={user} className="shrink-0">
                <User pubkey={user} className={avatarClassname} />
              </figure>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

function User({ pubkey, className }: { pubkey: string; className?: string }) {
  const { profile } = useProfileValue(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <Avatar
      className={cn(
        "relative inline-block h-8 w-8 rounded-full ring-2 ring-background",
        className
      )}
      fallback={getTwoLetters({ npub, profile })}
      src={profile?.image}
      alt={"User Profile Image"}
    />
  );
}
