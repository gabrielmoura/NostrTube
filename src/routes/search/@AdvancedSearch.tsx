import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { type eventSearchType } from "@/helper/loaders/getVideosFromSearchData";
import { Switch } from "@/components/ui/switch";
import { COMBOBOX_LANGUAGES } from "@/default";
import { buildInputFromSearchState, buildSearchStateFromInput, type SearchChipToken } from "@/features/search/services/search-query-parser.service";
import useUserStore from "@/store/useUserStore";

export function AdvancedSearch() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/search/" }) as eventSearchType;
  const storedGeoHash = useUserStore((state) => state.session?.geoHash);

  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [chips, setChips] = useState<SearchChipToken[]>([]);
  const [geohashEnabled, setGeohashEnabled] = useState(false);

  const { register, handleSubmit, setValue, watch, control } = useForm<eventSearchType>({
    defaultValues: {
      search: searchParams.search || "",
      author: searchParams.author || "",
      geohash: searchParams.geohash || "",
      lang: searchParams.lang || "",
      timeRange: searchParams.timeRange || "all",
      nsfw: searchParams.nsfw || false
    }
  });

  useEffect(() => {
    setValue("search", searchParams.search);
    setValue("author", searchParams.author);
    setValue("geohash", searchParams.geohash || "");
    setValue("lang", searchParams.lang);
    setValue("timeRange", searchParams.timeRange || "all");
    setValue("nsfw", searchParams.nsfw || false);
    setSearchInput(buildInputFromSearchState(searchParams));
    setChips(buildSearchStateFromInput(buildInputFromSearchState(searchParams), searchParams).chips);
    if (searchParams.geohash) setGeohashEnabled(true);
  }, [searchParams, setValue, storedGeoHash]);

  const selectedLanguage = watch("lang");

  const visibleLanguages = useMemo(() => COMBOBOX_LANGUAGES.slice(0, 10), []);

  const applyInput = (input: string) => {
    const parsed = buildSearchStateFromInput(input, searchParams);
    setChips(parsed.chips);
    setValue("search", parsed.search || undefined);
    setValue("author", parsed.author || undefined);
    setValue("lang", parsed.lang || undefined);
  };

  const removeChip = (chipToRemove: SearchChipToken) => {
    const nextChips = chips.filter((chip) => !(chip.type === chipToRemove.type && chip.value === chipToRemove.value));
    const nextInput = [watch("search") || "", ...nextChips.map((chip) => chip.label)].filter(Boolean).join(" ").trim();
    setSearchInput(nextInput);
    applyInput(nextInput);
  };

  const injectLanguage = (lang: string) => {
    const cleaned = chips.filter((chip) => chip.type !== "lang");
    const nextInput = [watch("search") || "", ...cleaned.map((chip) => chip.label), lang === "all" ? "" : `lang:${lang}`].filter(Boolean).join(" ").trim();
    setSearchInput(nextInput);
    applyInput(nextInput);
  };

  const onSubmit = (data: eventSearchType) => {
    const parsed = buildSearchStateFromInput(searchInput, data);
    const cleanData = Object.fromEntries(
      Object.entries({
        ...data,
        search: parsed.search || undefined,
        tag: parsed.tag.length ? parsed.tag : undefined,
        lang: parsed.lang || undefined,
        author: parsed.author || undefined,
        geohash: geohashEnabled ? (data.geohash?.trim().toLowerCase() || undefined) : undefined
      }).filter(([_, value]) => value != null && value !== "" && value !== "all")
    );

    navigate({
      to: "/search",
      search: cleanData as never
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border bg-background p-4 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSearchInput(nextValue);
                  applyInput(nextValue);
                }}
                onBlur={() => applyInput(searchInput)}
                placeholder="Buscar vídeos, tag:bitcoin, lang:pt, author:npub..."
                className="pl-8"
              />
            </div>

            <Select value={selectedLanguage || "all"} onValueChange={injectLanguage}>
              <SelectTrigger className="w-full lg:w-[190px]">
                <SelectValue placeholder="Idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os idiomas</SelectItem>
                {visibleLanguages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    {lang.native || lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit">Buscar</Button>

            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                type="button"
                className={isOpen ? "bg-accent text-accent-foreground" : ""}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Filtros Avançados</span>
              </Button>
            </CollapsibleTrigger>
          </div>

          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Badge key={`${chip.type}:${chip.value}`} variant="secondary" className="px-3 py-1">
                  {chip.label}
                  <button type="button" onClick={() => removeChip(chip)} className="ml-2 hover:text-destructive focus:outline-none">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}

          <CollapsibleContent className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Autor (Npub)</Label>
                <Input id="author" {...register("author")} placeholder="npub1..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geohash">Geohash</Label>
                <div className="flex gap-2">
                  <Input id="geohash" {...register("geohash")} placeholder={storedGeoHash || "abc"} maxLength={12} className="flex-1" />
                  <Button
                    type="button"
                    variant={geohashEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGeohashEnabled((prev) => !prev)}
                    className="shrink-0"
                  >
                    {geohashEnabled ? "Ativo" : "Inativo"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data de Publicação</Label>
                <Select onValueChange={(val: eventSearchType["timeRange"]) => setValue("timeRange", val)} defaultValue={watch("timeRange")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer data</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                    <SelectItem value="year">Este ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Controller
                  name="nsfw"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} id="nsfw-mode" />
                  )}
                />
                <Label htmlFor="nsfw-mode" className="cursor-pointer">Incluir conteúdo sensível (+18)</Label>
              </div>
              <Button type="submit" className="w-full md:w-auto">
                Aplicar Filtros
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </form>
    </div>
  );
}
