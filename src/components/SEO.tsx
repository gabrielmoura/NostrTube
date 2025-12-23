import { Helmet } from "react-helmet-async";

export interface SEOProps {
  title: string;
  description: string;
}

export function SEO({ title, description }: SEOProps) {
  return (
    <Helmet>
      <title>{title} - NostrTube</title>
      <meta name="description" content={description} />
    </Helmet>
  );
}