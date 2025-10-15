import SelectModal from "./SelectModal.tsx";
import type {NDKEvent, NDKKind, NDKRawEvent} from "@nostr-dev-kit/ndk";
import {uniqBy} from "ramda";
import {useNDK, useNDKCurrentPubkey, useSubscribe} from "@nostr-dev-kit/ndk-hooks";
import {getTagValue} from "@welshman/util";
import NDK from "@nostr-dev-kit/ndk";

type AddToPlaylistModal = {
    eventIdentifier: string;
};
//TODO; Falta terminar este componente
export default function AddToPlaylistModal({
                                               eventIdentifier,
                                           }: AddToPlaylistModal) {

    const currentPubkey = useNDKCurrentPubkey();
    const {events: userPlaylists} = useSubscribe([
            {
                authors: [currentPubkey],
                kinds: [30005 as NDKKind],
            }
        ],
        {}
    )
    // const {events: userPlaylists, isLoading: loadingPlaylists} = useEvents({
    //     filter: {
    //
    //     },
    // });
    const processedPlaylists = uniqBy(
        (e) => e.tagId(),
        userPlaylists.sort((a, b) => {
            if (!a.created_at || !b.created_at) return 0;
            if (a.created_at > b.created_at) {
                return -1;
            } else {
                return 1;
            }
        }),
    );
    const {ndk} = useNDK();
    async function updateList(ndk: NDK, ndkRawEvent: NDKRawEvent, p: string[][]){}

    async function handleUpdateList(playlist: NDKEvent) {
        if (!ndk) return;
        try {
            const promise = updateList(ndk, playlist.rawEvent(), [
                ["a", eventIdentifier],
            ]);

            toast.promise(promise, {
                loading: "Adding to playlist",
                success: (data) => {
                    modal.dismiss();
                    return `Video has been added to playlist!`;
                },
                error: "Error",
            });
        } catch (err) {
            console.log("Error adding event", err);
            toast.error("Error adding event");
        }
    }

    return (
        <SelectMo
            al
            options={userPlaylists}
            loadingOptions={loadingPlaylists}
            getKeyAndLabel={(e) => ({
                key: e.tagId(),
                label: getTagValue("title", e.tags) ?? e.id,
            })}
            onSelect={(p) => handleUpdateList(p)}
            title="Select a playlist"
            description="This video will be added to the chosen playlist"
        />
    );
}
