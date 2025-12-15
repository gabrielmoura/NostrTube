// import {Button} from "@radix-ui/themes";
import { Button } from "@/components/button.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/videoPlayer/components/Tooltip.tsx";


// type TextTracksProps = {
//   url?: string;
//   onChange?: (video: string) => void;
// };
export default function TextTracks() {
  //   const { UploadButton, fileUrl, status } = useUpload({
  //     folderName: "text-tracks",
  //   });

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger>
          <Button>Upload</Button>
        </TooltipTrigger>
        <TooltipContent align="center">
          <p>Coming Soon</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  //   return (
  //     <UploadButton>
  //       <Button loading={status === "uploading"} variant={"secondary"}>
  //         Upload
  //       </Button>
  //     </UploadButton>
  //   );
}
