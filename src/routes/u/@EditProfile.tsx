import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useCurrentUserProfile } from "@nostr-dev-kit/ndk-hooks";
import { useMutation } from "@tanstack/react-query";
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
  const user = useCurrentUserProfile();

  const [form, setForm] = useState<ProfileForm>({
    displayName: user?.name ?? "",
    username: user?.username ?? "",
    about: user?.about ?? "",
    website: user?.website ?? "",
    nip05: user?.nip05 ?? "",
    lnAddress: user?.lud16 ?? "",
    avatar: user?.picture ?? "",
    banner: user?.banner ?? ""
  });

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const mut = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: async (newProfile:ProfileForm) => {
      // Here you would implement the logic to update the profile on the backend or Nostr network
      console.log("Updating profile with data:", newProfile);
      return Promise.resolve();
    }
  });

  const handleSubmit = (e) => {
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

            <Button type="submit" className="w-full"
                    disabled={mut.isPending}
            >Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
