// src/components/Header.jsx
import {Fragment, useState} from 'react'
import {Disclosure, Menu, Transition} from '@headlessui/react'
import {MenuIcon, SearchIcon, XIcon} from "lucide-react";
import {BellIcon} from "@heroicons/react/24/outline";
import {Avatar, Box, Button, Card, Dialog, Flex, Text, TextField} from "@radix-ui/themes";
import {NDKNip07Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk";
import {
    useCurrentUserProfile,
    useNDKCurrentPubkey,
    useNDKSessionLogin,
    useNDKSessionLogout
} from "@nostr-dev-kit/ndk-hooks";
import {Link, linkOptions} from "@tanstack/react-router";
import {cn} from "@/helper/format.ts";
import useUserStore from "@/store/userStore.ts";
import LogoIcon from "@/components/logo/LogoIcon.tsx";


// Seu Header, agora com o componente UserActions
export default function Header() {
    const currentProfile = useCurrentUserProfile();
    const SetProfile = useUserStore(s => s.SetProfile)
    if (currentProfile) {
        SetProfile(currentProfile)
    }

    const options = linkOptions([
        {
            to: '/',
            label: 'Home',
            activeOptions: {exact: true},
        },
        {
            to: '/new',
            label: 'Novo',
        },
        {
            to: '/search',
            label: 'Buscar',
        },
        {
            to: "/terms",
            label: "Termos de Uso"
        }
    ])

    return (
        <Disclosure as="nav" className="bg-white shadow">

            <>
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex px-2 lg:px-0">
                            <div className="flex-shrink-0 flex items-center">
                                <LogoIcon
                                    aria-label={ import.meta.env.VITE_APP_NAME}
                                    title={ import.meta.env.VITE_APP_NAME}
                                    className="hidden lg:block h-8 w-auto"
                                />
                                <img
                                    className="block lg:hidden h-8 w-auto"
                                    src="/vite.svg"
                                    alt={import.meta.env.VITE_APP_NAME}
                                />
                            </div>
                            <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                                {options.map((option) => {
                                    return (
                                        <Link
                                            to={option.to}
                                            key={option.to}
                                            className="px-1 pt-1 border-b-2 text-sm font-medium inline-flex items-center"
                                            activeProps={{className: "border-indigo-500 text-gray-900"}}
                                            inactiveProps={{className: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"}}
                                        >
                                            {option.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
                            <div className="max-w-lg w-full lg:max-w-xs">
                                <label htmlFor="search" className="sr-only">
                                    Search
                                </label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true"/>
                                    </div>
                                    <input
                                        id="search"
                                        name="search"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Press Enter to search"
                                        type="search"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const query = (e.target as HTMLInputElement).value;
                                                // redireciona para a página de busca com a query
                                                window.location.href = `/search?search=${encodeURIComponent(query)}`;
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center lg:hidden">
                            {/* Mobile menu button */}
                            <Disclosure.Button
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {({open}) => open ? <XIcon className="block h-6 w-6" aria-hidden="true"/> :
                                    <MenuIcon className="block h-6 w-6" aria-hidden="true"/>}

                            </Disclosure.Button>
                        </div>
                        <div className="hidden lg:ml-4 lg:flex lg:items-center">
                            <button
                                type="button"
                                className="flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none "
                            >
                                <span className="sr-only">View notifications</span>
                                <BellIcon className="h-6 w-6" aria-hidden="true"/>
                            </button>

                            {/* Profile dropdown */}
                            {currentProfile ? <Menu as="div" className="ml-4 relative flex-shrink-0">
                                    <div>
                                        <Menu.Button
                                            className="bg-white rounded-full flex text-sm focus:outline-none">
                                            <span className="sr-only">Open user menu</span>
                                            <Card>
                                                <Flex gap="3" align="center">
                                                    <Avatar
                                                        size="3"
                                                        src={currentProfile?.picture}
                                                        radius="full"
                                                        fallback="T"
                                                    />
                                                    <Box>
                                                        <Text as="div" size="2" weight="bold">
                                                            {currentProfile?.name}
                                                        </Text>
                                                        <Text as="div" size="2" color="gray">
                                                            {currentProfile?.displayName}
                                                        </Text>
                                                    </Box>
                                                </Flex>
                                            </Card>

                                        </Menu.Button>
                                    </div>
                                    <ProfileMenuHeader/>
                                </Menu> :

                                <LoginButtonModal/>

                            }
                        </div>
                    </div>
                </div>

                <Disclosure.Panel className="lg:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800" */}
                        <Disclosure.Button
                            as="a"
                            href="#"
                            className="bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                        >
                            Dashboard
                        </Disclosure.Button>
                        <Disclosure.Button
                            as="a"
                            href="#"
                            className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                        >
                            Team
                        </Disclosure.Button>
                        <Disclosure.Button
                            as="a"
                            href="#"
                            className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                        >
                            Projects
                        </Disclosure.Button>
                        <Disclosure.Button
                            as="a"
                            href="#"
                            className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                        >
                            Calendar
                        </Disclosure.Button>
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        <div className="flex items-center px-4">
                            <div className="flex-shrink-0">
                                <img
                                    className="h-10 w-10 rounded-full"
                                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                    alt=""
                                />
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-gray-800">Tom Cook</div>
                                <div className="text-sm font-medium text-gray-500">tom@example.com</div>
                            </div>
                            <button
                                type="button"
                                className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <span className="sr-only">View notifications</span>
                                <BellIcon className="h-6 w-6" aria-hidden="true"/>
                            </button>
                        </div>
                        <div className="mt-3 space-y-1">
                            <Disclosure.Button
                                as="a"
                                href="#"
                                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            >
                                Your Profile
                            </Disclosure.Button>
                            <Disclosure.Button
                                as="a"
                                href="#"
                                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            >
                                Settings
                            </Disclosure.Button>
                            <Disclosure.Button
                                as="a"
                                href="#"
                                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            >
                                Sign out
                            </Disclosure.Button>
                        </div>
                    </div>
                </Disclosure.Panel>
            </>

        </Disclosure>
    );
}

function LoginButtonModal() {
    const login = useNDKSessionLogin();
    const [nsec, setNsec] = useState<string>()
    // const [bunker, setBunker] = useState<string>()
    const loginWithExtension = async () => {
        const signer = new NDKNip07Signer();
        await login(signer, true);
    };


    const handleLoginNsec = async () => {
        if (nsec) return
        try {
            // Create a signer from the private key
            const signer = new NDKPrivateKeySigner(nsec as string);

            // Login and create a session
            await login(signer);

            // Success! User is now logged in
            console.log('Login successful');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return <Dialog.Root>
        <Dialog.Trigger>
            <Button>Login</Button>
        </Dialog.Trigger>

        <Dialog.Content>
            <Dialog.Title>Login</Dialog.Title>
            <Dialog.Description size="2" mb="4">
                Escolha um método de entrar
            </Dialog.Description>
            <Flex direction="column" gap="3" mb="4">
                <Flex direction="column" gap="3">
                    <label>
                        <Text as="div" size="2" mb="1" weight="bold">
                            NSEC
                        </Text>
                        <TextField.Root
                            onChange={(e) => setNsec(e.target.value)}
                            defaultValue="nsec..."
                            placeholder="Enter your NSEC"
                        />
                        <Button onClick={handleLoginNsec}>Logar com NSEC</Button>
                    </label>
                </Flex>

                <Button onClick={loginWithExtension}>Logar com Extensão</Button>
            </Flex>
        </Dialog.Content>
    </Dialog.Root>
}

function ProfileMenuHeader() {
    const logout = useNDKSessionLogout()
    const clanSession = useUserStore(s => s.clanSession)
    const currentPubkey = useNDKCurrentPubkey()


    function handleLogout() {
        logout()
        clanSession()
    }

    return <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
    >
        <Menu.Items
            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
                {({active}) => (
                    <Link
                        to="/u/$userId"
                        params={{userId: currentPubkey}}
                        className={cn('block px-4 py-2 text-sm text-gray-700', {'bg-gray-100': active})}
                    >
                        Your Profile
                    </Link>
                )}
            </Menu.Item>
            <Menu.Item>
                {({active}) => (
                    <button

                        className={cn('block px-4 py-2 text-sm text-gray-700', {'bg-gray-100': active})}
                    >
                        Settings
                    </button>
                )}
            </Menu.Item>
            <Menu.Item>
                {({active}) => (
                    <button
                        onClick={() => handleLogout()}

                        className={cn('block px-4 py-2 text-sm text-gray-700', {'bg-gray-100': active})}
                    >
                        Sign out
                    </button>
                )}
            </Menu.Item>
        </Menu.Items>
    </Transition>
}