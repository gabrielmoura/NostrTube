import {createFileRoute} from '@tanstack/react-router'
import {useEffect} from "react";
import {Flex, Text} from "@radix-ui/themes";

export const Route = createFileRoute('/')({
    component: IndexPage,
})

function IndexPage() {
    useEffect(() => {
        document.title = import.meta.env.VITE_APP_NAME;
    }, []);
    return (
        <>
            <Flex direction="column" gap="2" className="items-center justify-center">
                <Text>Em desenvolvimento!</Text>
                {/*<LanguagesCombo/>*/}
            </Flex>
        </>
    )
}
