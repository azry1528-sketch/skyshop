import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useRef, useState, KeyboardEvent } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Cat = { slug: string; label: string; children?: { slug: string; label: string }[] };

const MobileCategoryItem = ({ cat, onNavigate }: { cat: Cat; onNavigate: () => void }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!cat.children?.length) {
    return (
      <Link
        to={`/category/${cat.slug}`}
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted focus:bg-muted focus:outline-none text-sm font-medium"
      >
        {cat.label}
      </Link>
    );
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-stretch rounded-xl hover:bg-muted">
        <Link
          to={`/category/${cat.slug}`}
          onClick={onNavigate}
          className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium focus:bg-muted focus:outline-none rounded-l-xl"
        >
          {cat.label}
        </Link>
        <CollapsibleTrigger
          ref={triggerRef}
          aria-label={`Afficher les sous-catégories de ${cat.label}`}
          aria-expanded={open}
          className="px-3 flex items-center justify-center text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring rounded-r-xl"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent onKeyDown={onKey}>
        <div className="ml-6 border-l border-border pl-3 mt-1 space-y-0.5">
          {cat.children.map((s) => (
            <Link
              key={s.slug}
              to={`/category/${s.slug}`}
              onClick={onNavigate}
              className="block px-2 py-1.5 rounded-lg hover:bg-muted focus:bg-muted focus:outline-none text-xs text-muted-foreground hover:text-foreground"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MobileCategoryItem;
