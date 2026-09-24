import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { pixelPageView } from "@/lib/fbPixel";

/**
 * Déclenche un événement PageView du Pixel Facebook à chaque changement de route.
 * Le tout premier PageView est déjà envoyé par le code de base dans index.html,
 * donc on l'ignore ici pour ne pas le compter deux fois.
 */
const PixelPageView = () => {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    pixelPageView();
  }, [pathname]);

  return null;
};

export default PixelPageView;
