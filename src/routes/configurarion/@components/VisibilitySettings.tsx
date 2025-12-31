import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next"; // Recomendado para React
import {
  AlertCircle, Eye, EyeOff, UserCheck,
  ChevronDown, Check, Shield
} from "lucide-react";
import { Card, CardHeader, Switch } from "./CommonComponents";
import { LoggerAgent } from "@/lib/debug.ts";
import useUserStore from "@/store/useUserStore.ts";
import { AgeEnum } from "@/store/store/sessionTypes.ts";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const log = LoggerAgent.create("VisibilitySettings");

export const VisibilitySettings = () => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={t("visibility.title")}
        icon={Shield}
      />

      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex flex-col">
        <NsfwSwitch onError={setError} />
        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 mx-4" />
        <AgeFilterSelect onError={setError} />
      </div>
    </Card>
  );
};

function NsfwSwitch({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useTranslation();
  const nsfw = useUserStore((state) => state.config?.nsfw) ?? false;
  const setNsfw = useUserStore((state) => state.setNsfw);

  const handleToggle = async () => {
    try {
      onError(null);
      await setNsfw(!nsfw);
    } catch (err) {
      log.error("Error updating NSFW:", err);
      onError(t("visibility.error_nsfw"));
    }
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          nsfw ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
        )}>
          {!nsfw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{t("visibility.nsfw_label")}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {nsfw ? t("visibility.nsfw_on") : t("visibility.nsfw_off")}
          </p>
        </div>
      </div>
      <Switch checked={nsfw} onCheckedChange={handleToggle} />
    </div>
  );
}

function AgeFilterSelect({ onError }: { onError: (m: string | null) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const age = useUserStore((state) => state.config?.age) as string;
  const setAge = useUserStore((state) => state.setAge);

  const ageOptions = [
    { value: "KID", label: t("visibility.ages.KID") },
    { value: "TEEN", label: t("visibility.ages.TEEN") },
    { value: "ADULT", label: t("visibility.ages.ADULT") },
  ];

  const selectedOption = ageOptions.find((opt) => opt.value === age) || ageOptions[1];

  const handleSelect = useCallback(async (newValue: string) => {
    try {
      onError(null);
      await setAge(newValue as AgeEnum);
      setOpen(false);
    } catch (err) {
      log.error("Error updating age:", err);
      onError(t("visibility.error_age"));
    }
  }, [setAge, onError, t]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{t("visibility.age_label")}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("visibility.age_description")}</p>
        </div>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full sm:w-[220px] justify-between bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
          >
            {selectedOption.label}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[220px] p-0" align="end">
          <Command className="bg-white dark:bg-zinc-950">
            <CommandInput placeholder={t("visibility.search_placeholder")} />
            <CommandList>
              <CommandEmpty>{t("visibility.no_results")}</CommandEmpty>
              <CommandGroup>
                {ageOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", age === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}