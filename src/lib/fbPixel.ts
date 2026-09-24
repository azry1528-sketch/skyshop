/**
 * Utilitaire centralisé pour le Pixel Facebook (Meta Pixel).
 *
 * Le code de base (init + PageView initial) est dans index.html.
 * Ce fichier ne gère que les événements envoyés depuis le code React :
 * PageView (changements de route), ViewContent, AddToCart, InitiateCheckout, Purchase.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown };
  }
}

const CURRENCY = "EUR";

/** true si le script du pixel a bien été chargé (window.fbq existe) */
const isPixelReady = () => typeof window !== "undefined" && typeof window.fbq === "function";

/** PageView manuel — utilisé pour les changements de route côté client (SPA) */
export const pixelPageView = () => {
  if (!isPixelReady()) return;
  window.fbq!("track", "PageView");
};

export const pixelViewContent = (product: {
  id: string;
  name: string;
  price_xaf: number;
}) => {
  if (!isPixelReady()) return;
  window.fbq!("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price_xaf,
    currency: CURRENCY,
  });
};

export const pixelAddToCart = (
  item: { id: string; name: string; price_xaf: number },
  quantity = 1
) => {
  if (!isPixelReady()) return;
  window.fbq!("track", "AddToCart", {
    content_ids: [item.id],
    content_name: item.name,
    content_type: "product",
    value: item.price_xaf * quantity,
    currency: CURRENCY,
    contents: [{ id: item.id, quantity }],
  });
};

export const pixelInitiateCheckout = (params: {
  contentIds: string[];
  numItems: number;
  value: number;
}) => {
  if (!isPixelReady()) return;
  window.fbq!("track", "InitiateCheckout", {
    content_ids: params.contentIds,
    num_items: params.numItems,
    value: params.value,
    currency: CURRENCY,
  });
};

export const pixelPurchase = (params: {
  contentIds: string[];
  value: number;
  orderReference: string;
}) => {
  if (!isPixelReady()) return;
  window.fbq!(
    "track",
    "Purchase",
    {
      content_ids: params.contentIds,
      content_type: "product",
      value: params.value,
      currency: CURRENCY,
    },
    { eventID: params.orderReference }
  );
};
