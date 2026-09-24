import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: object;
}

const BASE_TITLE = "SkyRide Store";
const BASE_DESC = "Trottinettes électriques et motos type Surron en France. Livraison partout en France.";
const BASE_IMAGE = "https://images.unsplash.com/photo-1604868189265-219ba7a3c6a5?w=1200&q=80";
const BASE_URL = "https://skyridestore.fr";

const SEO = ({ title, description, image, url, type = "website", schema }: SEOProps) => {
  const fullTitle = title ? `${title} — ${BASE_TITLE}` : `${BASE_TITLE} — Trottinettes & Surron en France`;
  const desc = description || BASE_DESC;
  const img = image || BASE_IMAGE;
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
