// import {Button} from "@radix-ui/themes";
import { Button } from '@/components/button.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/videoPlayer/components/Tooltip.tsx'
export default function TextTracks() {
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
  )
}
