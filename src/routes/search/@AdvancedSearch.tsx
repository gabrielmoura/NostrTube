import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Plus, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { type eventSearchType } from "@/helper/loaders/getVideosFromSearchData";
import { Switch } from "@/components/ui/switch"; // Certifique-se de ter este componente

const LANGUAGES = [
  { value: "en", label: "Inglês" },
  { value: "pt", label: "Português" },
  { value: "es", label: "Espanhol" },
  { value: "ja", label: "Japonês" }
];

export function AdvancedSearch() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/search/" }) as eventSearchType;

  const [isOpen, setIsOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const initialTags = Array.isArray(searchParams.tag)
    ? searchParams.tag
    : searchParams.tag ? [searchParams.tag] : [];

  const [tags, setTags] = useState<string[]>(initialTags);

  const { register, handleSubmit, setValue, watch, control } = useForm<eventSearchType>({
    defaultValues: {
      search: searchParams.search || "",
      author: searchParams.author || "",
      lang: searchParams.lang || "",
      timeRange: searchParams.timeRange || "all",
      nsfw: searchParams.nsfw || false
    }
  });

  useEffect(() => {
    setValue("search", searchParams.search);
    setValue("author", searchParams.author);
    setValue("lang", searchParams.lang);
    setValue("timeRange", searchParams.timeRange || "all");
    setValue("nsfw", searchParams.nsfw || false);
    const currentTags = Array.isArray(searchParams.tag)
      ? searchParams.tag
      : searchParams.tag ? [searchParams.tag] : [];
    setTags(currentTags);
  }, [searchParams, setValue]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const onSubmit = (data: eventSearchType) => {
    const cleanData = Object.fromEntries(
      Object.entries({ ...data, tag: tags }).filter(([_, v]) => v != null && v !== "" && v !== "all")
    );
    if (tags.length === 0) delete cleanData.tag;

    navigate({
      to: "/search/",
      search: cleanData as any
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-background border rounded-lg shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* CORREÇÃO: O Collapsible agora envolve tudo */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">

          {/* Busca Principal e Botão Trigger */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                {...register("search")}
                placeholder="Buscar vídeos..."
                className="pl-8"
              />
            </div>
            <Button type="submit">Buscar</Button>

            {/* O Trigger agora está corretamente dentro do Collapsible */}
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

          {/* Conteúdo dos Filtros */}
          <CollapsibleContent className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Filtro de Autor */}
              <div className="space-y-2">
                <Label htmlFor="author">Autor (Npub)</Label>
                <Input
                  id="author"
                  {...register("author")}
                  placeholder="npub1..."
                />
              </div>

              {/* Filtro de Idioma */}
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select
                  onValueChange={(val) => setValue("lang", val)}
                  defaultValue={watch("lang")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Data */}
              <div className="space-y-2">
                <Label>Data de Publicação</Label>
                <Select
                  onValueChange={(val: any) => setValue("timeRange", val)}
                  defaultValue={watch("timeRange")}
                >
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

            {/* Gerenciamento de Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Adicionar tag (ex: bitcoin, music) e pressione Enter"
                  className="max-w-md"
                />
                <Button type="button" variant="secondary" onClick={handleAddTag}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-destructive focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Controller
                  name="nsfw"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="nsfw-mode"
                    />
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