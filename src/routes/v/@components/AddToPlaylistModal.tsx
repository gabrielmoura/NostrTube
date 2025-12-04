import { type NDKEvent, NDKKind, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
import { uniqBy } from "ramda";
import { useNDK, useNDKCurrentPubkey, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { getTagValue } from "@welshman/util";
import { toast } from "sonner";
import { addToPlayList, addToPlayListEvent } from "@/helper/actions/playlist.ts";
import { cn } from "@/lib/utils";
import Spinner from "@/components/Spinner.tsx";
import { modal } from "@/components/modal_v2/modal-manager.ts";
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/modal_v2/Drawer.tsx";

type AddToPlaylistModal = {
  eventIdTag: string;
};

export default function AddToPlaylistModal({
                                             eventIdTag
                                           }: AddToPlaylistModal) {

  const currentPubkey = useNDKCurrentPubkey();
  const { events: userPlaylists, eose: loadingPlaylists } = useSubscribe([
      {
        authors: [currentPubkey!],
        kinds: [NDKKind.VideoCurationSet]
      }
    ],
    { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST }
  );

  const processedPlaylists = uniqBy(
    (e) => e.tagId(),
    userPlaylists.sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      if (a.created_at > b.created_at) {
        return -1;
      } else {
        return 1;
      }
    })
  );

  async function handleUpdateList(playlist: NDKEvent) {
    try {
      toast.promise(addToPlayListEvent({ playLisEvent: playlist, eventIdTag: eventIdTag }), {
        loading: "Adding to playlist",
        success: (data) => {
          console.log("Novo Evento ", data);
          modal.dismissAll();
          return `Video has been added to playlist!`;
        },
        error: "Error"
      });
    } catch (err) {
      console.log("Error adding event", err);
      toast.error("Error adding event");
    }
  }

  return (
    <SelectModal
      options={userPlaylists}
      loadingOptions={!loadingPlaylists}
      getKeyAndLabel={(e) => ({
        key: e.tagId(),
        label: getTagValue("title", e.tags) ?? e.id
      })}
      onSelect={(p) => handleUpdateList(p)}
      title="Select a playlist"
      description="This video will be added to the chosen playlist"
    />
  );
}

type SelectModalProps<ItemType> = {
  title?: string;
  description?: string;
  listContainerClassName?: string;
  options: ItemType[];
  getKeyAndLabel: (i: ItemType) => { key: string; label: string };
  selected?: ItemType;
  loadingOptions?: boolean;
  onSelect: (i: ItemType) => void;
};

function SelectModal<ItemType>({
                                 title = "Select an option",
                                 description,
                                 listContainerClassName,
                                 options,
                                 getKeyAndLabel,
                                 selected,
                                 onSelect,
                                 loadingOptions
                               }: SelectModalProps<ItemType>) {
  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="text-xl">{title}</DrawerTitle>
        {!!description && <DrawerDescription>{description}</DrawerDescription>}
      </DrawerHeader>
      <DrawerBody className="">
        <ul className={cn("space-y-4", listContainerClassName)}>
          {options.map((p) => (
            <li key={getKeyAndLabel(p).key} className="">
              <TileButton
                onClick={() => onSelect(p)}
                active={
                  selected &&
                  getKeyAndLabel(p).key === getKeyAndLabel(selected).key
                }
                className="w-full font-semibold"
              >
                {getKeyAndLabel(p).label}
              </TileButton>
            </li>
          ))}
        </ul>
        {loadingOptions && (
          <div className="center py-3">
            <Spinner />
          </div>
        )}
      </DrawerBody>
      <DrawerFooter></DrawerFooter>
    </>
  );
}

type TileButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function TileButton({
                             active,
                             className,
                             children,
                             ...props
                           }: TileButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "hover flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 transition-all",
        active
          ? "border-primary hover:opacity-70"
          : "text-muted-foreground hover:border-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

