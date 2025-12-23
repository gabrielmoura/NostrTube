import { RiMore2Fill } from "react-icons/ri";
import { Button } from "@/components/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";

type DropDownOptionsProps = {
  options: { label: string; action: () => void }[];
};

export default function DropDownOptions({ options }: DropDownOptionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
        >
          <RiMore2Fill className="h-4 w-4" />
          <span className="sr-only">menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {options.map((o) => (
          <DropdownMenuItem key={o.label} onClick={o.action}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
