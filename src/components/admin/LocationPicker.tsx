"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

interface LocationPickerProps {
  lat: string;
  lng: string;
  onSelect: (lat: string, lng: string, city: string, address: string) => void;
}

export default function LocationPicker({ lat, lng, onSelect }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const defaultLat = lat ? Number(lat) : 5.6037;
  const defaultLng = lng ? Number(lng) : -0.187;

  // Move marker and fire onSelect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placeMarker = useCallback((latVal: number, lngVal: number, label?: string, city?: string, address?: string) => {
    if (!leafletMapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([latVal, lngVal]);
    leafletMapRef.current.setView([latVal, lngVal], 15);
    if (label) setSelectedLabel(label);
    onSelect(String(latVal), String(lngVal), city ?? "", address ?? "");
  }, [onSelect]);

  // Init Leaflet (must be client-only)
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // Fix default marker icons broken in webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: lat && lng ? 15 : 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

      // Drag end — reverse geocode to get address
      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        setSelectedLabel(`${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
        onSelect(String(pos.lat), String(pos.lng), "", "");

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data.display_name) {
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const address = data.address?.suburb || data.address?.neighbourhood || data.address?.road || "";
            setSelectedLabel(data.display_name.split(",").slice(0, 2).join(",").trim());
            onSelect(String(pos.lat), String(pos.lng), city, address);
          }
        } catch { /* ignore */ }
      });

      // Click on map to move marker
      map.on("click", async (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onSelect(String(e.latlng.lat), String(e.latlng.lng), "", "");

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data.display_name) {
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const address = data.address?.suburb || data.address?.neighbourhood || data.address?.road || "";
            setSelectedLabel(data.display_name.split(",").slice(0, 2).join(",").trim());
            onSelect(String(e.latlng.lat), String(e.latlng.lng), city, address);
          }
        } catch { /* ignore */ }
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);

      if (lat && lng) {
        setSelectedLabel(`${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`);
      }
    }

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search using Nominatim
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=gh`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: LocationResult[] = await res.json();
      setResults(data);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, [query]);

  function handleResultClick(r: LocationResult) {
    const latVal = Number(r.lat);
    const lngVal = Number(r.lon);
    const city = r.address?.city || r.address?.town || r.address?.village || "";
    const address = r.address?.suburb || r.address?.neighbourhood || r.address?.road || "";
    const label = r.display_name.split(",").slice(0, 2).join(",").trim();

    placeMarker(latVal, lngVal, label, city, address);
    setResults([]);
    setQuery(label);
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6c757d]" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              placeholder="Search address or landmark in Ghana…"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white placeholder:text-[#adb5bd]"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#6c757d]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-[#c9a961] text-white text-xs font-semibold hover:bg-[#9a7b3c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Search
          </button>
        </div>

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="absolute z-[9999] top-full mt-1 w-full bg-white border border-[#e9ecef] rounded-xl shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleResultClick(r)}
                className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-[#f8f9fa] transition-colors border-b border-[#f0f0f0] last:border-0"
              >
                <MapPin className="h-4 w-4 text-[#c9a961] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#1a1a1a] line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-[#e9ecef]" style={{ height: 280 }}>
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        {!mapReady && (
          <div className="absolute inset-0 bg-[#f4f5f7] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#c9a961]" />
          </div>
        )}
      </div>

      {/* Selected coordinates */}
      {(lat || lng) && (
        <div className="flex items-center gap-2 text-xs text-[#6c757d] bg-[#f8f9fa] rounded-xl px-3 py-2">
          <MapPin className="h-3.5 w-3.5 text-[#c9a961] flex-shrink-0" />
          <span className="truncate">
            {selectedLabel || `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`}
          </span>
          <span className="font-mono ml-auto flex-shrink-0 text-[#adb5bd]">
            {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
        </div>
      )}

      <p className="text-[10px] text-[#adb5bd]">
        Search for an address, then click a result — or click directly on the map to pin a location. Drag the pin to adjust.
      </p>
    </div>
  );
}
