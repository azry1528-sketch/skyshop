import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
});

type Pos = { lat: number; lng: number };

const ClickHandler = ({ onPick }: { onPick: (p: Pos) => void }) => {
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
};

const Recenter = ({ pos }: { pos: Pos | null }) => {
  const map = useMap();
  useEffect(() => { if (pos) map.setView([pos.lat, pos.lng], 16, { animate: true }); }, [pos]);
  return null;
};

interface Props {
  value: Pos | null;
  onChange: (p: Pos, address?: string) => void;
}

const LocationPicker = ({ value, onChange }: Props) => {
  const { t } = useI18n();
  const [locating, setLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "success" | "error">("idle");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const center: Pos = value ?? { lat: 46.603354, lng: 1.888334 }; // Centre de la France

  const reverse = async (p: Pos): Promise<string | undefined> => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.lat}&lon=${p.lng}&zoom=18&addressdetails=1&countrycodes=fr`,
        { headers: { "Accept-Language": "fr" } }
      );
      const j = await r.json();
      return j.display_name as string | undefined;
    } catch { return undefined; }
  };

  const handlePick = useCallback(async (p: Pos) => {
    const addr = await reverse(p);
    onChange(p, addr);
  }, [onChange]);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée par ce navigateur.");
      setGpsStatus("error");
      return;
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then(result => {
        if (result.state === "denied") {
          toast.error("Permission GPS refusée", {
            description: "Allez dans Paramètres → Site → Localisation pour autoriser.",
          });
          setGpsStatus("error");
        }
      });
    }

    setLocating(true);
    setGpsStatus("idle");

    let resolved = false;

    // Étape 1 : position rapide (basse précision, ~1-2s)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (resolved) return;
        resolved = true;
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setAccuracy(Math.round(pos.coords.accuracy));
        setLocating(false);
        setGpsStatus("success");
        await handlePick(p);
        toast.success("Position récupérée !", {
          description: `Précision : ±${Math.round(pos.coords.accuracy)}m`,
        });

        // Étape 2 : affiner en arrière-plan si précision faible (>100m)
        if (pos.coords.accuracy > 100) {
          navigator.geolocation.getCurrentPosition(
            async (pos2) => {
              const p2 = { lat: pos2.coords.latitude, lng: pos2.coords.longitude };
              setAccuracy(Math.round(pos2.coords.accuracy));
              await handlePick(p2);
              toast.success("Position affinée", {
                description: `Précision améliorée : ±${Math.round(pos2.coords.accuracy)}m`,
              });
            },
            () => {/* silence — on garde la position rapide */},
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        }
      },
      (err) => {
        if (resolved) return;
        resolved = true;
        setLocating(false);
        setGpsStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Permission GPS refusée", {
            description: "Autorisez la localisation dans les paramètres du navigateur, puis réessayez.",
          });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error("Position indisponible", {
            description: "Activez le GPS sur votre appareil ou cliquez directement sur la carte.",
          });
        } else if (err.code === err.TIMEOUT) {
          toast.error("Délai dépassé", {
            description: "La localisation prend trop de temps. Cliquez sur la carte à la place.",
          });
        } else {
          toast.error("Impossible de récupérer la position", {
            description: "Cliquez directement sur la carte pour placer le marqueur.",
          });
        }
      },
      // Basse précision d'abord : très rapide (cache réseau/IP accepté)
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {value ? "Glissez le marqueur ou recliquez pour ajuster" : "Cliquez sur la carte ou utilisez votre GPS"}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={locate} disabled={locating}
          className={gpsStatus === "success" ? "border-success text-success" : gpsStatus === "error" ? "border-destructive text-destructive" : ""}
        >
          {locating
            ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t("checkout.locating")}</>
            : gpsStatus === "success"
            ? <><CheckCircle2 className="h-3 w-3 mr-1" />Position OK</>
            : gpsStatus === "error"
            ? <><AlertTriangle className="h-3 w-3 mr-1" />Réessayer</>
            : <><MapPin className="h-3 w-3 mr-1" />{t("checkout.locate_me")}</>
          }
        </Button>
      </div>

      <div
        className="h-56 rounded-xl overflow-hidden border border-border"
        style={{ isolation: "isolate", contain: "layout" }}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 16 : 6}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap'
          />
          <ClickHandler onPick={handlePick} />
          <Recenter pos={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={icon}
              draggable
              eventHandlers={{
                dragend: (e: any) => handlePick({
                  lat: e.target.getLatLng().lat,
                  lng: e.target.getLatLng().lng,
                }),
              }}
            />
          )}
        </MapContainer>
      </div>

      {value ? (
        <p className="text-[11px] text-success font-medium flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Position enregistrée {accuracy ? `(précision ±${accuracy}m)` : ""} ·{" "}
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">Aucune position sélectionnée — cliquez sur la carte ou utilisez le bouton GPS</p>
      )}
    </div>
  );
};

export default LocationPicker;
