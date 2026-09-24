import { ArrowUp } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const ScrollToTopFab = () => {
  const { pathname } = useLocation();
  const [atBottom, setAtBottom] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;
      setAtBottom(nearBottom);
      if (timer.current) window.clearTimeout(timer.current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (pathname.startsWith("/checkout") || pathname.startsWith("/order") || pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;
  if (!atBottom) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Retour en haut"
        className="pointer-events-auto h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-warm flex items-center justify-center hover:scale-110 transition-smooth"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ScrollToTopFab;
