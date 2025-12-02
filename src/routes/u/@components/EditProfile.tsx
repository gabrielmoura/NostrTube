import { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { motion } from "framer-motion";
import { useCurrentUserProfile, useNDK, useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { useMutation } from "@tanstack/react-query";
import { ButtonWithLoader } from "@/components/ButtonWithLoader.tsx";
import { makeEvent } from "@/helper/pow/pow.ts";
import { nostrNow } from "@/helper/date.ts";
import { NDKKind } from "@nostr-dev-kit/ndk";

interface ProfileForm {
  displayName?: string;
  username?: string;
  about?: string;
  website?: string;
  nip05?: string;
  lnAddress?: string;
  avatar?: string;
  banner?: string;
}

export default function CreateProfile() {
  const userProfile = useCurrentUserProfile();
  const currentPubkey = useNDKCurrentPubkey();
  const { ndk } = useNDK();

  const [form, setForm] = useState<ProfileForm>({
    displayName: userProfile?.displayName ?? "",
    username: userProfile?.name ?? "",
    about: userProfile?.about ?? "",
    website: userProfile?.website ?? "",
    nip05: userProfile?.nip05 ?? "",
    lnAddress: userProfile?.lud16 ?? "",
    avatar: userProfile?.picture ?? "",
    banner: userProfile?.banner ?? ""
  });

  const handleChange = (field: string) => (e: { target: { value: unknown; }; }) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const mut = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: async (newProfile: ProfileForm) => {
      // Here you would implement the logic to update the profile on the backend or Nostr network
      const event = await makeEvent({
        ndk: ndk!,
        event: {
          created_at: nostrNow(),
          pubkey: currentPubkey!,
          kind: NDKKind.Metadata,
          content: JSON.stringify({
            name: newProfile.username,
            display_name: newProfile.displayName,
            about: newProfile.about,
            website: newProfile.website,
            nip05: newProfile.nip05,
            lud16: newProfile.lnAddress,
            picture: newProfile.avatar,
            banner: newProfile.banner
          }),
          tags: []
        }, difficulty: 16
      });

      await event.publish();
      return event;
    }
  });

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    mut.mutate(form);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto p-6 space-y-6">
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Banner */}
            <div className="flex flex-col space-y-2">
              <Label>Capa</Label>
              <Input type="text" placeholder="URL da imagem de capa" value={form.banner}
                     onChange={handleChange("banner")} />
              {form.banner && (
                <img src={form.banner} alt="banner" className="h-40 w-full object-cover rounded-xl" />
              )}
            </div>

            {/* Avatar */}
            <div className="flex flex-col space-y-2">
              <Label>Foto de perfil</Label>
              <Input type="text" placeholder="URL do avatar" value={form.avatar} onChange={handleChange("avatar")} />
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={form.avatar} />
                  <AvatarFallback>AV</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Label>Nome de exibição</Label>
              <Input placeholder="Seu nome" value={form.displayName} onChange={handleChange("displayName")} />
            </div>

            {/* Username */}
            <div>
              <Label>Nome de utilizador</Label>
              <Input placeholder="@username" value={form.username} onChange={handleChange("username")} />
            </div>

            {/* About */}
            <div>
              <Label>Sobre</Label>
              <Textarea className="min-h-[120px]" placeholder="Fale sobre você" value={form.about}
                        onChange={handleChange("about")} />
            </div>

            {/* Website */}
            <div>
              <Label>Website</Label>
              <Input placeholder="https://meusite.com" value={form.website} onChange={handleChange("website")} />
            </div>

            {/* NIP-05 */}
            <div>
              <Label>NIP-05</Label>
              <Input placeholder="ex: nome@seu-dominio.com" value={form.nip05} onChange={handleChange("nip05")} />
            </div>

            {/* Lightning */}
            <div>
              <Label>Endereço Lightning</Label>
              <Input placeholder="ex: fulano@walletofsatoshi.com" value={form.lnAddress}
                     onChange={handleChange("lnAddress")} />
            </div>

            <ButtonWithLoader type="submit" className="w-full"
                              isLoading={mut.isPending}
            >Salvar</ButtonWithLoader>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
