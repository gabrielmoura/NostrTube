import {Button, Flex, Text} from "@radix-ui/themes";
import {Link} from "@tanstack/react-router";
import {useEffect} from "react";
import {imageproxy} from "@/helper/http.ts";


function App() {
    useEffect(() => {
        document.title = import.meta.env.VITE_APP_NAME;
    }, []);
    return (
        <>
            <Flex direction="column" gap="2">
                <Text>Hello from Radix Themes :)</Text>
                <Link
                    to={"/v/$eventId"}
                    params={{"eventId": "naddr1qvzqqqy9hvpzpyd75hxexc2sf3qf4t69j5tf3rmg5t7dfqnk9lvknf7dcuwlg3guqyd8wumn8ghj7un9d3shjtnwdaehgunrdpjkx6ewd4jj7qgawaehxw309ahx7um5wgknqvfw09skk6tgdahxuefwvdhk6tcqy3p9qh6jf98473z9ta9yznj9f9fy7h6sg9fyrsud2d84732dtap5ss2dg9fsx3qv7u"}}
                    about={"Rio de Janeiro: Paraíso em chamas"}
                    preload={"intent"}
                >
                    <Button>Assistir Rio de Janeiro: Paraíso em chamas</Button>
                </Link>
                <Link
                    to={"/v/$eventId"}
                    params={{"eventId": "naddr1qvzqqqy9hvpzpzr9mu6dzh6uv59ywrm7tnc5vwhyn60s9egke7gszmarnh65k7ssqy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qq8fs6z6sm0xy6sjjnjwe"}}
                    about={"Idiocracia"}
                    preload={"intent"}
                >
                    <Button>Assistir Idiocracia</Button>
                </Link>

                <Link
                    to={"/v/$eventId"}
                    params={{"eventId": "naddr1qvzqqqy9hvpzpyd75hxexc2sf3qf4t69j5tf3rmg5t7dfqnk9lvknf7dcuwlg3guqyd8wumn8ghj7un9d3shjtnwdaehgunrdpjkx6ewd4jj7qghwaehxw309ahx7um5wghxz7n6v9kk7tnwv46z7qzq8qunzdmzxscnxvnzx9jnsdp3x5exge3svf3x2epjvyenydpnvv6xgef5vscrvctxxsenjefhxvux2vfkvd3nvetrxgck2d3sv3jkyegjg004t"}}
                    about={"Not Found"}
                    preload={"intent"}
                >
                    <Button>Assistir Not Found</Button>
                </Link>

                <Link
                    to={"/v/$eventId"}
                    params={{"eventId": "naddr1qvzqqqy9hvpzpyd75hxexc2sf3qf4t69j5tf3rmg5t7dfqnk9lvknf7dcuwlg3guqy28wue69uhkcmmrv9kxsmmnwsargwpk8yhsz9rhwvaz7tmvda3kzmrgdaehgw358qmrjtcqz4847smpwdh47ntpwf5kzhmyv904qetwdpsslarhsd"}}
                    about={"Not Found"}
                    preload={"intent"}
                >
                    <Button>Assistir Maria da P</Button>
                </Link>
                <Link
                    to={"/v/$eventId"}
                    params={{"eventId": "naddr1qvzqqqy9hvpzpyd75hxexc2sf3qf4t69j5tf3rmg5t7dfqnk9lvknf7dcuwlg3guqy28wue69uhkcmmrv9kxsmmnwsargwpk8yhsq9zz2p05xmmjw35kuc2lv3j473n4d4skxcgv8dm63"}}
                    about={"Not Found"}
                    preload={"intent"}
                >
                    <Button>Cortina de Fumaça</Button>
                </Link>

            </Flex>
        </>
    )
}

export default App
