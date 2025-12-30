import * as React from "react";
import { cn } from "@/helper/format.ts";

//{
//               // Ajuste de altura para múltiplas linhas
//               "min-h-[70px]": snap?.title?.length <= 60,
//               "min-h-[90px]": snap?.title?.length > 60 && snap?.title?.length <= 120,
//               "min-h-[110px]": snap?.title?.length > 120,
//               // Limite máximo de altura
//               "max-h-[150px]": snap?.title?.length > 180,
//               // Ponha uma barra de rolagem caso exceda o limite
//               "overflow-y-auto": snap?.title?.length > 180,
//               // Ponha uma margem em vemelhor caso title seja vazio
//               "mt-2": snap?.title?.length === 0,
//             }


export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value ?? ""}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
export default Textarea;
