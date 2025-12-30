import { useMemo, useState } from "react";
import { t } from "i18next";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AgeEnum } from "@/store/store/sessionTypes.ts";
import { getAgeOptions } from "./ageTypes.ts";

export type AgeComboProps = {
  value?: AgeEnum | null;
  onChange?: (value: AgeEnum | null) => void;
  label?: string;
  placeholder?: string;
};

export default function AgeCombo({
                                   value,
                                   onChange,
                                   label = t("age.combo.title"),
                                   placeholder = t("age.combo.placeholder"),
                                 }: AgeComboProps) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => getAgeOptions(), []);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [value, options]
  );

  const handleSelect = (currentValue: AgeEnum) => {
    onChange?.(currentValue === value ? null : currentValue);
    setOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">
            {t("age.combo.helper")}
          </Label>

          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-normal"
                >
                  <span
                    className={cn(
                      "truncate",
                      !selectedOption && "text-muted-foreground"
                    )}
                  >
                    {selectedOption
                      ? t(`age.options.${selectedOption.id}.label`)
                      : placeholder}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder={t("age.combo.search")}
                    className="h-9"
                  />
                  <CommandEmpty>
                    {t("age.combo.empty")}
                  </CommandEmpty>

                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.id}
                        onSelect={() => handleSelect(option.id)}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {t(`age.options.${option.id}.label`)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {t(`age.options.${option.id}.description`)}
                          </span>
                        </div>

                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === option.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {value && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
