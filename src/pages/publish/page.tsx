import {Card, Flex, Text} from "@radix-ui/themes";

export function Publish() {
    return <Flex
        direction="column"
        gapX={"10px"}
        className="items-center ">

        Todo
        Ola mundo

        <Card>
            <Text className={"text-red-700 font-medium"}>Eu te amo</Text>

        </Card>

    </Flex>
}