import { createFileRoute } from "@tanstack/react-router";
import { Flex, Text } from "@radix-ui/themes";
import { t } from "i18next";
import { Helmet } from "react-helmet-async";

export const Route = createFileRoute("/")({
  component: IndexPage
});

function IndexPage() {

  return (
    <>
      <Helmet>
        <title>{import.meta.env.VITE_APP_NAME || "Home"}</title>
        <meta name="description"
              content={t("Home_Page_Description", "Welcome to the home page of NostrTube, the decentralized video sharing platform built on the Nostr protocol.")} />
      </Helmet>
      <Flex direction="column" gap="2" className="items-center justify-center">
        <Text>{t("In_Development", "Em desenvolvimento!")}</Text>
      </Flex>
    </>
  );
}
