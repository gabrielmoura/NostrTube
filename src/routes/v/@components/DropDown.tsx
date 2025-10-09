import * as React from "react";
import {HamburgerMenuIcon} from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {useNavigate} from "@tanstack/react-router";
import {toast} from "react-toastify";
import {copyText, downloadVideo, getVideoDetails} from "@/helper/format.ts";
import {useNDKCurrentPubkey} from "@nostr-dev-kit/ndk-hooks";


const modal = {
    show: (component: React.ReactNode) => console.log("Modal Show:", component),
};
const AddToPlaylistModal = ({eventIdentifier}: { eventIdentifier: string }) => (
    <div>Add to Playlist Modal for: {eventIdentifier}</div>
);

export const DropdownMenuVideo = ({event}) => {

    const navigate = useNavigate();
    const npub = useNDKCurrentPubkey()
    const rawEvent = event.rawEvent();
    const {url, title} = getVideoDetails(event)

    function handleDownload() {
        downloadVideo(url, title).then(() => toast("Video has been downloaded", {type: "success"}));
    }

    const options = [
        {
            label: "Share video",
            action: () => {
                copyText(
                    `${
                        import.meta.env.VITE_BASE_URL ??
                        "https://nostrtube.com"
                    }/w/${event.encode()}`,
                ).then(() => toast("Link copied!", {type: "success"}))

            },
        },
        {
            label: "Add to Playlist",
            action: () => {
                modal.show(
                    <AddToPlaylistModal eventIdentifier={event.tagId()}/>,
                );
            },
        },
        {
            label: "Download video",
            action: () => {
                handleDownload();
            },
        },
        {
            label: "Copy raw event",
            action: () => {
                copyText(JSON.stringify(rawEvent)).then(() => toast("Copied event", {type: "success"}));
            },
        },
        ...(npub === event.author.pubkey
            ? [
                {
                    label: "Edit Event",
                    action: async () => {
                        await navigate({
                            to: "/v/$eventId",
                            params: {eventId: getTagValues("d", event.tags) ?? ""},
                        })
                    },
                },
            ]
            : []),
    ];

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="inline-flex size-[35px] items-center justify-center rounded-full bg-white text-violet11 shadow-[0_2px_10px] shadow-blackA4 outline-none hover:bg-violet3 focus:shadow-[0_0_0_2px] focus:shadow-black"
                    aria-label="Customise options"
                >
                    <HamburgerMenuIcon/>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
                    sideOffset={5}
                >
                    {options.map((option, index) => (
                        <DropdownMenu.Item
                            key={index}
                            className="group relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[5px] text-[13px] leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1"
                            onClick={option.action}
                        >
                            {option.label}
                        </DropdownMenu.Item>
                    ))}

                    <DropdownMenu.Separator className="m-[5px] h-px bg-violet6"/>
                    <DropdownMenu.Arrow className="fill-white"/>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
export default DropdownMenuVideo;