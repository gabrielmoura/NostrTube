import * as React from "react"
import {Link} from "@tanstack/react-router"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {Sheet, SheetContent, SheetTrigger,} from "@/components/ui/sheet"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Bell, LogOut, Menu, Moon, Search, Settings, Sun, User,} from "lucide-react"
import {cn} from "@/helper/format"
import {LogoNovo, LogoNovoMono} from "@/components/logo/LogoNovo"
import {useCurrentUserProfile, useNDKCurrentPubkey, useNDKSessionLogout,} from "@nostr-dev-kit/ndk-hooks"
import useUserStore from "@/store/userStore"
import {LoginModal} from "@/components/header/LoginModal"

export default function Header() {
    const currentProfile = useCurrentUserProfile()
    const SetProfile = useUserStore((s) => s.SetProfile)
    const [theme, setTheme] = React.useState(
        localStorage.getItem("theme") || "light"
    )

    React.useEffect(() => {
        if (currentProfile) SetProfile(currentProfile)
    }, [currentProfile, SetProfile])

    // Aplica o tema e adiciona classe de transição
    React.useEffect(() => {
        const root = document.documentElement
        root.classList.add("theme-transition")
        root.classList.toggle("dark", theme === "dark")
        localStorage.setItem("theme", theme)

        const timeout = setTimeout(() => {
            root.classList.remove("theme-transition")
        }, 400)

        return () => clearTimeout(timeout)
    }, [theme])

    const options = [
        {to: "/", label: "Home", exact: true},
        {to: "/new", label: "Novo"},
        {to: "/search", label: "Buscar"},
        {to: "/terms", label: "Termos de Uso"},
    ]

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const query = (e.target as HTMLInputElement).value
            window.location.href = `/search?search=${encodeURIComponent(query)}`
        }
    }

    return (
        <header
            className={cn(
                "sticky top-0 z-40 w-full bg-background/80 backdrop-blur",
                "border-b border-border shadow-sm transition-colors duration-300"
            )}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild className="lg:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5"/>
                                <span className="sr-only">Abrir menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64">
                            <nav className="flex flex-col space-y-3 mt-4">
                                {options.map((opt) => (
                                    <Link
                                        key={opt.to}
                                        to={opt.to}
                                        className="text-lg font-medium hover:text-primary transition"
                                        activeProps={{
                                            className: "text-primary font-semibold",
                                        }}
                                    >
                                        {opt.label}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <LogoNovo className="hidden h-8 w-auto lg:block"/>
                        <LogoNovoMono className="block h-8 w-auto lg:hidden"/>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex lg:space-x-6">
                        {options.map((opt) => (
                            <Link
                                key={opt.to}
                                to={opt.to}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                activeProps={{
                                    className: "text-primary border-b-2 border-primary",
                                }}
                            >
                                {opt.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Center Search */}
                <div className="hidden sm:flex flex-1 justify-center max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                        <Input
                            type="search"
                            placeholder="Pressione Enter para buscar"
                            className="pl-9"
                            onKeyDown={handleSearch}
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Theme toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? (
                            <Moon className="h-5 w-5"/>
                        ) : (
                            <Sun className="h-5 w-5"/>
                        )}
                        <span className="sr-only">Alternar tema</span>
                    </Button>

                    {/* Notifications */}
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5"/>
                        <span className="sr-only">Notificações</span>
                    </Button>

                    {/* Profile */}
                    {currentProfile ? (
                        <UserMenu currentProfile={currentProfile}/>
                    ) : (
                        <LoginModal/>
                    )}
                </div>
            </div>
        </header>
    )
}

// ---- Profile Menu ----
function UserMenu({currentProfile}: { currentProfile: any }) {
    const logout = useNDKSessionLogout()
    const clanSession = useUserStore((s) => s.clanSession)
    const currentPubkey = useNDKCurrentPubkey()

    const handleLogout = () => {
        logout()
        clanSession()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={currentProfile?.picture}/>
                        <AvatarFallback>
                            {currentProfile?.name?.[0] ?? "U"}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">
            {currentProfile?.name || "Usuário"}
          </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                    <Link to="/u/$userId" params={{userId: currentPubkey}}>
                        <User className="mr-2 h-4 w-4"/> Perfil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4"/> Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4"/> Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
