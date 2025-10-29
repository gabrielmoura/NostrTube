import * as React from "react";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Check, ChevronsUpDown, X} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card"
import {Label} from "@/components/ui/label.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem} from "@/components/ui/command.tsx";
import {detectLanguageMain} from "@/helper/userLang.ts";
import {COMBOBOX_LANGUAGES} from "@/default.ts";
import {t} from "i18next";

export type Language = { id: string; name: string; native?: string; };


export type LanguagesComboProps = {
    value?: Language | null;
    onChange?: (lang: Language | null) => void;
    placeholder?: string;
    label?: string;
};

export default function LanguagesCombo({
                                           value: controlledValue = null,
                                           onChange,
                                           placeholder = "Selecione um idioma...",
                                           label = "Idioma",
                                       }: LanguagesComboProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [value, setValue] = useState<Language | null>(controlledValue || null);

// Derive filtered list const filtered = useMemo(() => { const q = query.trim().toLowerCase(); if (!q) return TOP_10_LANGUAGES; return TOP_10_LANGUAGES.filter( (l) => l.name.toLowerCase().includes(q) || (l.native || "").toLowerCase().includes(q) || l.id === q ); }, [query]);


    function handleSelect(lang: Language) {
        setValue(lang);
        onChange?.(lang);
        setOpen(false);
        setQuery("");
    }

    function clear() {
        setValue(null);
        onChange?.(null);
    }

    useEffect(() => {
        const newDef = detectLanguageMain()!
        if (newDef) {
            const lang = COMBOBOX_LANGUAGES.find(l => l.id === newDef?.split("-")[0]);
            if (lang) {
                setValue(lang);
                onChange?.(lang);
            }
        }
    }, [onChange, setValue]);

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-sm">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    <Label
                        className="text-xs">{t('components.comboLanguage.selectYourLanguage', 'Select your content language.')}</Label>

                    <Popover open={open} onOpenChange={setOpen}>
                        <div className="flex items-center gap-2">
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={() => setOpen((s) => !s)}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <div className="flex flex-col text-left truncate">
                  <span className="truncate">
                    {value ? `${value.name} ${value.native ? `· ${value.native}` : ""}` : placeholder}
                  </span>
                                        </div>
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4"/>
                                </Button>
                            </PopoverTrigger>

                            {value && (
                                <Button variant="ghost" size="icon" onClick={clear}
                                        aria-label={t('components.comboLanguage.clearSelection', 'Clear selection')}>
                                    <X/>
                                </Button>
                            )}
                        </div>

                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Pesquisar idioma..."
                                    value={query}
                                    onValueChange={(v: string) => setQuery(v)}
                                    className="h-10"
                                />
                                <CommandEmpty>
                                    {t('components.comboLanguage.noLanguageFound', 'No language found')}
                                </CommandEmpty>

                                <CommandGroup>
                                    {COMBOBOX_LANGUAGES.map((lang) => (
                                        <CommandItem
                                            key={lang.id}
                                            onSelect={() => handleSelect(lang)}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex flex-col text-left">
                                                <span>{lang.name}</span>
                                                <span className="text-xs opacity-70">{lang.native}</span>
                                            </div>

                                            {value?.id === lang.id ? <Check className="h-4 w-4"/> : null}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
        </Card>

    );
}
