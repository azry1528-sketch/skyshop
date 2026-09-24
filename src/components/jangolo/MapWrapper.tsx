import { Suspense, lazy } from "react";
import { Loader2, MapPin } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";

const LocationPicker = lazy(() => import("./LocationPicker"));

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }, address?: string) => void;
}

const MapFallback = ({ message }: { message: string }) => (
  <div className="h-56 rounded-xl border border-border bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground">
    <MapPin className="h-6 w-6" />
    <p className="text-xs">{message}</p>
  </div>
);

const MapWrapper = (props: Props) => (
  <ErrorBoundary
    fallback={
      <div className="space-y-2">
        <MapFallback message="Carte indisponible. Vous pouvez tout de même renseigner votre adresse ci-dessus." />
      </div>
    }
  >
    <Suspense
      fallback={
        <div className="h-56 rounded-xl border border-border bg-muted/30 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      }
    >
      <LocationPicker {...props} />
    </Suspense>
  </ErrorBoundary>
);

export default MapWrapper;
