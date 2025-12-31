import { EyeOff } from "lucide-react";

export const NSFWOverlay = () => (
  <div
    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl transition-all group-hover:backdrop-blur-2xl">
    <EyeOff className="w-8 h-8 text-white/70" />
    <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
      Sensitive Content
    </span>
  </div>
);