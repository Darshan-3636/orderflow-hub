import { Star } from "lucide-react";

export function StarRating({ value, onChange, size = 28 }: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="transition-transform hover:scale-110">
          <Star
            style={{ width: size, height: size }}
            className={i <= value ? "fill-warning text-warning" : "text-muted-foreground/40"}
          />
        </button>
      ))}
    </div>
  );
}
