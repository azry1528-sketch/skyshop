import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, User, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BottomNav = () => {
  const { count } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Hide on admin/auth pages
  if (pathname.startsWith("/admin") || pathname === "/auth") return null;

  const handleSearch = () => navigate("/search");

  const items = [
    { to: "/", icon: Home, label: t("nav.home"), badge: 0 },
    { to: "/categories", icon: LayoutGrid, label: t("nav.categories_short"), badge: 0 },
    { to: null, icon: Search, label: "Recherche", badge: 0, action: handleSearch },
    { to: "/checkout", icon: ShoppingBag, label: t("nav.cart"), badge: count },
    { to: user ? "/account" : "/auth", icon: User, label: user ? t("nav.account_short") : t("nav.signin"), badge: 0 },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map((it, idx) => {
          const Icon = it.icon;
          if (it.action) {
            return (
              <li key={idx}>
                <button
                  onClick={it.action}
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground w-full"
                >
                  <span className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-warm">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </span>
                  <span className="truncate max-w-[60px]">{it.label}</span>
                </button>
              </li>
            );
          }
          return (
            <li key={it.to}>
              <NavLink
                to={it.to!}
                end={it.to === "/"}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {it.badge && it.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      {it.badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate max-w-[60px]">{it.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
