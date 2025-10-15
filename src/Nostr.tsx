import {Outlet} from "react-router";
import Header from "@/components/header/Header.tsx";


export function Nostr() {

    return <main className="min-h-[100svh]  bg-background sm:absolute sm:inset-0">
        <div className="f1">
            {/* Header */}
            <Header/>
        </div>

        <Outlet/>
    </main>
}
