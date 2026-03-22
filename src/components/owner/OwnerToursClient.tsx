"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe, Play, Edit2, X, Check, Home, Eye, EyeOff } from "lucide-react";

interface TourProperty {
  id: string;
  title: string;
  city: string;
  propertyType: string;
  hasVirtualTour: boolean;
  virtualTourUrl: string | null;
  images: { imageUrl: string }[];
}

type FilterType = "all" | "has-tour" | "no-tour";

export default function OwnerToursClient({ properties }: { properties: TourProperty[] }) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [localProperties, setLocalProperties] = useState(properties);

  const filtered = localProperties.filter((p) => {
    if (filter === "has-tour") return p.hasVirtualTour;
    if (filter === "no-tour")  return !p.hasVirtualTour;
    return true;
  });

  const hasTourCount = localProperties.filter((p) => p.hasVirtualTour).length;
  const noTourCount  = localProperties.filter((p) => !p.hasVirtualTour).length;

  const startEdit = (p: TourProperty) => {
    setEditingId(p.id);
    setEditUrl(p.virtualTourUrl ?? "");
    setSaveError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl("");
    setSaveError("");
  };

  const saveUrl = async (id: string) => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/owner/properties/${id}/tour`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ virtualTourUrl: editUrl.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setLocalProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, virtualTourUrl: editUrl.trim() || null, hasVirtualTour: !!editUrl.trim() }
            : p
        )
      );
      setEditingId(null);
    } catch {
      setSaveError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {([
          { value: "all",      label: "All Properties", count: localProperties.length },
          { value: "has-tour", label: "Has Tour",        count: hasTourCount },
          { value: "no-tour",  label: "No Tour",         count: noTourCount },
        ] as { value: FilterType; label: string; count: number }[]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              filter === tab.value
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#343a40] border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961]"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.value ? "bg-white/20 text-white" : "bg-[#f0f0f0] text-[#6c757d]"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Properties grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-16 text-center">
          <Globe className="h-12 w-12 text-[#e0e0e0] mx-auto mb-4" />
          <p className="font-['Playfair_Display'] text-lg font-bold text-[#1a1a1a] mb-2">No Properties Found</p>
          <p className="text-[#6c757d] text-sm">No properties match the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((property) => {
            const thumbnail = property.images[0]?.imageUrl;
            const isEditing = editingId === property.id;

            return (
              <div
                key={property.id}
                className="bg-white rounded-2xl border border-white/80 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-[#f0f0f0]">
                  {thumbnail ? (
                    <Image src={thumbnail} alt={property.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-10 w-10 text-[#d0d0d0]" />
                    </div>
                  )}
                  {property.hasVirtualTour ? (
                    <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#c9a961] text-white font-semibold">
                      <Globe className="h-3 w-3" /> Has 360° Tour
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full bg-white/80 text-[#6c757d] font-medium border border-[#e9ecef]">
                      No Tour
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-base line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-[#6c757d] text-xs mt-0.5">
                      {property.city} · <span className="capitalize">{property.propertyType}</span>
                    </p>
                  </div>

                  {/* Edit URL section */}
                  {isEditing ? (
                    <div className="mb-3 space-y-2">
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="https://my360tour.com/..."
                        className="w-full h-9 px-3 rounded-lg border border-[#e9ecef] text-xs focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961]"
                      />
                      {saveError && (
                        <p className="text-red-500 text-xs">{saveError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveUrl(property.id)}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-[#c9a961] text-white text-xs font-semibold hover:bg-[#9a7b3c] transition-colors disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-[#e9ecef] text-xs text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    property.virtualTourUrl && (
                      <p className="text-xs text-[#adb5bd] mb-3 truncate">{property.virtualTourUrl}</p>
                    )
                  )}

                  {/* Action buttons */}
                  {!isEditing && (
                    <div className="flex gap-2">
                      {property.hasVirtualTour && property.virtualTourUrl && (
                        <button
                          onClick={() => setPreviewUrl(property.virtualTourUrl!)}
                          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#1a1a1a] text-white text-xs font-semibold hover:bg-[#333] transition-colors"
                        >
                          <Play className="h-3.5 w-3.5" /> Preview Tour
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(property)}
                        className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                          property.hasVirtualTour
                            ? "border-[#e9ecef] text-[#343a40] hover:border-[#c9a961] hover:text-[#c9a961]"
                            : "flex-1 bg-[#c9a961]/10 border-[#c9a961]/20 text-[#c9a961] hover:bg-[#c9a961]/20"
                        }`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        {property.hasVirtualTour ? "Edit URL" : "Add Tour URL"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewUrl(null); }}
        >
          <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-[#c9a961]" />
              <span className="font-semibold text-sm">Virtual Tour Preview</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                <Eye className="h-4 w-4" /> Open in new tab
              </a>
              <button
                onClick={() => setPreviewUrl(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              allow="fullscreen; xr-spatial-tracking"
              title="Virtual Tour"
            />
          </div>
        </div>
      )}
    </>
  );
}
