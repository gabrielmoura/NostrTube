import React, { type Dispatch, type SetStateAction, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Certifique-se de ter um utility para classes de tailwind
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { t } from "i18next";

interface AddTagButtonProps {
  onAdd: (tag: string) => void; // Altera para receber a tag diretamente
  label: string;
  placeholder?: string;
  regex?: RegExp;
  description?: string;
}

export function AddTagButton({
                               onAdd,
                               label,
                               placeholder,
                               regex,
                               description
                             }: AddTagButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (currentInput.trim() === "") {
      setError(t("components.addTagInput.error.empty", "The field cannot be empty."));
      return;
    }

    if (regex && !regex.test(currentInput)) {
      setError(t("components.addTagInput.error.invalidFormat", "Invalid format."));
      return;
    }

    onAdd(currentInput.trim());
    setCurrentInput("");
    setError(null);
    setIsOpen(false);
  };

  const isInputInvalid = !!error || (regex && currentInput && !regex.test(currentInput));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("Add", "Add")} {label}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Add", "Add")} {label}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="tag-add-input">Novo {label}</Label>
            <Input
              id="tag-add-input"
              value={currentInput}
              onChange={(e) => {
                setCurrentInput(e.target.value);
                setError(null);
              }}
              placeholder={placeholder}
              className={cn({ "border-destructive focus-visible:ring-destructive": isInputInvalid })}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            {regex && currentInput && !regex.test(currentInput) && (
              <p className="text-sm text-destructive mt-1">Formato inválido.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t("Cancel", "Cancel")}
          </Button>
          <Button type="submit" onClick={handleAdd} disabled={!currentInput || isInputInvalid}>
            {t("Add", "Add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddTagInputProps {
  initialTags?: string[];
  onTagsChange: Dispatch<SetStateAction<string[]>>;
  label: string;
  placeholder?: string;
  regex?: RegExp;
  description?: string;
  className?: string;
}

export function AddTagInput({
                              initialTags = [],
                              onTagsChange,
                              label,
                              placeholder,
                              regex,
                              description,
                              className
                            }: AddTagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    onTagsChange(tags);
  }, [tags, onTagsChange]);

  const handleAddTag = () => {
    if (currentInput.trim() === "") {
      setError(t("components.addTagInput.error.empty", "The field cannot be empty."));
      return;
    }

    if (regex && !regex.test(currentInput)) {

      setError(t("components.addTagInput.error.invalidFormat", "Invalid format."));
      return;
    }

    if (tags.includes(currentInput.trim())) {
      setError(t("components.addTagInput.error.duplicate", "This tag already exists."));
      return;
    }

    setTags((prev) => [...prev, currentInput.trim()]);
    setCurrentInput("");
    setError(null);
    setIsOpen(false); // Fecha o modal após adicionar
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const isInputInvalid = !!error || (regex && currentInput && !regex.test(currentInput));

  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm space-y-3", className)}>
      <Label className="text-sm font-medium">{label}</Label>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Tag key={index} onRemove={() => handleRemoveTag(tag)}>
              {tag}
            </Tag>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{placeholder || `Adicione ${label.toLowerCase()}`}</p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            {t("Add", "Add")} {label}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Add", "Add")} {label}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tag-input">{t("New")} {label}</Label>
              <Input
                id="tag-input"
                value={currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value);
                  setError(null); // Limpa o erro ao digitar
                }}
                placeholder={placeholder}
                className={cn({ "border-destructive focus-visible:ring-destructive": isInputInvalid })}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              {error && <p className="text-sm text-destructive mt-1">{error}</p>}
              {regex && currentInput && !regex.test(currentInput) && (
                <p
                  className="text-sm text-destructive mt-1">{t("components.addTagInput.error.invalidFormat", "Invalid format.")}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t("Cancel", "Cancel")}
            </Button>
            <Button type="submit" onClick={handleAddTag} disabled={!currentInput || isInputInvalid}>
              {t("Add", "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const tagVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  onRemove?: () => void;
}

export const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, variant, onRemove, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(tagVariants({ variant }), className)}
        {...props}
      >
        {children}
        {onRemove && (
          <button
            type="button"
            className="ml-1 -mr-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-primary-foreground/70 hover:bg-primary-foreground/20 hover:text-primary-foreground focus:bg-primary-foreground/20 focus:text-primary-foreground focus:outline-none"
            onClick={onRemove}
          >
            <XIcon className="h-3 w-3" />
            <span className="sr-only">Remove tag</span>
          </button>
        )}
      </div>
    );
  }
);
Tag.displayName = "Tag";