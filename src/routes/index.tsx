import {createFileRoute} from '@tanstack/react-router'
import {useEffect} from "react";
import {Flex, Text} from "@radix-ui/themes";
import {serviceWorkerRPC} from "@/sw/client/rpc.ts";
export const Route = createFileRoute('/')({
    component: IndexPage,
})

function IndexPage() {
    useEffect(() => {
        document.title = import.meta.env.VITE_APP_NAME;
    }, []);
    serviceWorkerRPC?.call("cache.getAll", void 0).subscribe({
        next: (data) => {
            console.log("Cache data:", data);
        },
        error: (err) => {
            console.error("Error fetching cache data:", err);
        }
    });
    return (
        <>
            <Flex direction="column" gap="2" className="items-center justify-center">
                <Text>Em desenvolvimento!</Text>
                {/*<LanguagesCombo/>*/}
            </Flex>
        </>
    )
}
