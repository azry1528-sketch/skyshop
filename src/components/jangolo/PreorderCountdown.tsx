import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const PreorderCountdown = ({ deadline }: { deadline: string }) => {
  const calc = () => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!time) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
      <Clock className="h-4 w-4 text-destructive shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-bold text-destructive uppercase tracking-wide">Précommande ferme dans</p>
        <div className="flex items-center gap-2 mt-1">
          {time.d > 0 && (
            <><span className="text-lg font-extrabold text-foreground">{time.d}</span><span className="text-xs text-muted-foreground">j</span></>
          )}
          <span className="text-lg font-extrabold text-foreground">{pad(time.h)}</span>
          <span className="text-xs text-muted-foreground">h</span>
          <span className="text-lg font-extrabold text-foreground">{pad(time.m)}</span>
          <span className="text-xs text-muted-foreground">min</span>
          <span className="text-lg font-extrabold text-foreground">{pad(time.s)}</span>
          <span className="text-xs text-muted-foreground">sec</span>
        </div>
      </div>
    </div>
  );
};

export default PreorderCountdown;
