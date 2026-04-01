"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Search, Edit2, Trash2, Eye, Home, Star, Loader2, X,
  CheckCircle, Upload, ImageIcon, Crown, MapPin, BedDouble,
  Bath, Users, DollarSign, Tag, FileText, Wifi, ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PropertyImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  caption: string | null;
}

interface Property {
  id: string;
  title: string;
  slug: string;
  city: string;
  address: string | null;
  propertyType: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  status: string;
  featured: boolean;
  hasVirtualTour: boolean;
  lodgifyPropertyId: string | null;
  lodgifyRoomTypeId: string | null;
  images: { imageUrl: string }[];
  _count: { bookings: number; reviews: number };
  owner?: { id: string; name: string | null; email: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const AMENITIES_LIST = [
  "WiFi", "Air Conditioning", "Swimming Pool", "Gym", "Parking",
  "Kitchen", "Washer/Dryer", "Smart TV", "DSTV", "Security",
  "Generator", "Balcony", "Garden", "BBQ Grill", "Dishwasher",
  "Work Desk", "Coffee Maker", "Hot Tub", "Elevator", "Pet Friendly",
];

const emptyForm = {
  title: "", slug: "", description: "", propertyType: "apartment",
  city: "", address: "", pricePerNight: "", bedrooms: "1",
  bathrooms: "1", maxGuests: "2", area: "", areaUnit: "sqft",
  amenities: [] as string[], featured: false, hasVirtualTour: false,
  virtualTourUrl: "", status: "available", lat: "", lng: "",
  lodgifyPropertyId: "", lodgifyRoomTypeId: "",
};

const PER_PAGE = 10;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({
  total,
  page,
  perPage,
  onChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  const range = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
      <p className="text-xs text-[#6c757d]">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="h-8 w-8 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          ‹
        </button>
        {range.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-8 w-8 rounded-lg text-sm font-medium ${p === page ? "bg-[#c9a961] text-white" : "border border-[#e9ecef] text-[#6c757d] hover:bg-[#f8f9fa]"}`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="h-8 w-8 rounded-lg border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Image Upload Panel ───────────────────────────────────────────────────────
function ImagePanel({
  propertyId,
  onDone,
}: {
  propertyId: string;
  onDone: () => void;
}) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Load existing images
  const loadImages = useCallback(async () => {
    const res = await fetch(`/api/admin/properties/${propertyId}/images`);
    const data = await res.json();
    if (data.images) { setImages(data.images); setLoaded(true); }
  }, [propertyId]);

  if (!loaded) { loadImages(); }

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/admin/properties/${propertyId}/images`, { method: "POST", body: fd });
        const data = await res.json();
        if (data.image) setImages(prev => [...prev, data.image]);
      }
    } finally { setUploading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDelete = async (imageId: string) => {
    setDeleting(imageId);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/images/${imageId}`, { method: "DELETE" });
      if (res.ok) setImages(prev => prev.filter(i => i.id !== imageId));
    } finally { setDeleting(null); }
  };

  const handleSetPrimary = async (imageId: string) => {
    setSettingPrimary(imageId);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/images/${imageId}`, { method: "PATCH" });
      if (res.ok) setImages(prev => prev.map(i => ({ ...i, isPrimary: i.id === imageId })));
    } finally { setSettingPrimary(null); }
  };

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-[#c9a961] bg-[#c9a961]/5" : "border-[#e9ecef] hover:border-[#c9a961]/50 hover:bg-[#fafafa]"}`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-[#c9a961]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[#c9a961] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#343a40]">Drop images here or click to browse</p>
            <p className="text-xs text-[#adb5bd] mt-1">JPG, PNG, WebP · Multiple files supported · Max 10MB each</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map(img => (
            <div key={img.id} className={`relative rounded-xl overflow-hidden aspect-square group border-2 transition-all ${img.isPrimary ? "border-[#c9a961] shadow-md" : "border-transparent"}`}>
              <Image src={img.imageUrl} alt={img.caption || "Property"} fill className="object-cover" />
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-[#c9a961] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5" /> Primary
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(img.id)}
                    disabled={settingPrimary === img.id}
                    className="w-8 h-8 rounded-full bg-[#c9a961] hover:bg-[#9a7b3c] flex items-center justify-center text-white transition-colors"
                    title="Set as primary"
                  >
                    {settingPrimary === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crown className="h-3.5 w-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={deleting === img.id}
                  className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                >
                  {deleting === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="text-center py-6 text-[#adb5bd]">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No images yet. Upload some above.</p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button variant="gold" onClick={onDone} className="gap-2">
          <CheckCircle className="h-4 w-4" /> Done
        </Button>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-[#f0f0f0] mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#c9a961]/10 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-[#c9a961]" />
      </div>
      <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider">{label}</h3>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-[#d1d5db]"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c9a961]/10 text-[#9a7b3c] border border-[#c9a961]/20 capitalize">
      {type}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PropertiesAdminClient({
  properties: initial,
  filterOwner = null,
}: {
  properties: Property[];
  filterOwner?: { id: string; name: string | null; email: string } | null;
}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [properties, setProperties] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedroomsFilter, setBedroomsFilter] = useState("any");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [step, setStep] = useState<"details" | "images">("details");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedPropertyId, setSavedPropertyId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const isFiltered =
    search !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    cityFilter !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    bedroomsFilter !== "any" ||
    featuredFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCityFilter("");
    setMinPrice("");
    setMaxPrice("");
    setBedroomsFilter("any");
    setFeaturedFilter("all");
  };

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, cityFilter, minPrice, maxPrice, bedroomsFilter, featuredFilter]);

  const handlePageChange = (p: number) => {
    setPage(p);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── Stats ───────────────────────────────────────────────────────────────
  const totalCount = properties.length;
  const availableCount = properties.filter(p => p.status === "available").length;
  const featuredCount = properties.filter(p => p.featured).length;

  // ─── Filtering ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return properties.filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchType = typeFilter === "all" || p.propertyType === typeFilter;
      const matchCity = !cityFilter || p.city.toLowerCase().includes(cityFilter.toLowerCase());
      const matchMinPrice = !minPrice || Number(p.pricePerNight) >= Number(minPrice);
      const matchMaxPrice = !maxPrice || Number(p.pricePerNight) <= Number(maxPrice);
      const matchBedrooms =
        bedroomsFilter === "any" || p.bedrooms >= Number(bedroomsFilter.replace("+", ""));
      const matchFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && p.featured) ||
        (featuredFilter === "not_featured" && !p.featured);
      return matchSearch && matchStatus && matchType && matchCity && matchMinPrice && matchMaxPrice && matchBedrooms && matchFeatured;
    });
  }, [properties, search, statusFilter, typeFilter, cityFilter, minPrice, maxPrice, bedroomsFilter, featuredFilter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page]
  );

  const openCreate = () => {
    setForm(emptyForm); setEditingId(null);
    setSavedPropertyId(null); setStep("details"); setPanelOpen(true);
  };

  const openEdit = async (p: Property) => {
    setForm({
      ...emptyForm,
      title: p.title, slug: p.slug, propertyType: p.propertyType,
      city: p.city, address: p.address || "", pricePerNight: String(p.pricePerNight),
      bedrooms: String(p.bedrooms), bathrooms: String(p.bathrooms),
      maxGuests: String(p.maxGuests), status: p.status, featured: p.featured,
      hasVirtualTour: p.hasVirtualTour,
      lodgifyPropertyId: p.lodgifyPropertyId || "",
      lodgifyRoomTypeId: p.lodgifyRoomTypeId || "",
    });
    setEditingId(p.id); setSavedPropertyId(p.id);
    setStep("details"); setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setEditingId(null); setSavedPropertyId(null); };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      if (res.ok) { setProperties(ps => ps.filter(p => p.id !== id)); toast("Property deleted."); }
    } finally { setDeleting(null); }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    await fetch(`/api/admin/properties/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured: !featured }) });
    setProperties(ps => ps.map(p => p.id === id ? { ...p, featured: !featured } : p));
  };

  const toast = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editingId ? `/api/admin/properties/${editingId}` : "/api/admin/properties";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pricePerNight: Number(form.pricePerNight),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          maxGuests: Number(form.maxGuests),
          area: form.area ? Number(form.area) : null,
          lat: form.lat ? Number(form.lat) : null,
          lng: form.lng ? Number(form.lng) : null,
        }),
      });
      const data = await res.json();
      if (data.error) { toast(data.error); return; }
      if (data.property) {
        if (editingId) {
          setProperties(ps => ps.map(p => p.id === editingId ? { ...p, ...data.property } : p));
          toast("Property updated!");
          setStep("images");
          setSavedPropertyId(editingId);
        } else {
          setProperties(ps => [{ ...data.property, _count: { bookings: 0, reviews: 0 }, images: [] }, ...ps]);
          toast("Property created! Now add images.");
          setSavedPropertyId(data.property.id);
          setEditingId(data.property.id);
          setStep("images");
        }
      }
    } finally { setSaving(false); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info"> = { available: "success", booked: "warning", maintenance: "danger", inactive: "info" };
    return <Badge variant={map[s] || "info"}>{s}</Badge>;
  };

  const inputClass = "w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] placeholder:text-[#adb5bd]";

  return (
    <div className="p-6 lg:p-8">
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {success && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Manage</p>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Properties</h1>
        </div>
        <Button variant="gold" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      {/* Owner filter banner */}
      {filterOwner && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
            {(filterOwner.name?.[0] ?? filterOwner.email[0]).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">
              Viewing properties for {filterOwner.name ?? filterOwner.email}
            </p>
            <p className="text-xs text-blue-600">{filterOwner.email}</p>
          </div>
          <a
            href="/admin/properties"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <ChevronRight className="h-3 w-3 rotate-180" /> All properties
          </a>
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Properties */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Home className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] leading-none">{totalCount}</p>
            <p className="text-xs text-[#6c757d] mt-1 font-medium">Total Properties</p>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] leading-none">{availableCount}</p>
            <p className="text-xs text-[#6c757d] mt-1 font-medium">Available</p>
          </div>
        </div>

        {/* 360° Tours */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Eye className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] leading-none">—</p>
            <p className="text-xs text-[#6c757d] mt-1 font-medium">360° Tours</p>
          </div>
        </div>

        {/* Featured */}
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#c9a961]/10 flex items-center justify-center flex-shrink-0">
            <Star className="h-5 w-5 text-[#c9a961]" />
          </div>
          <div>
            <p className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a] leading-none">{featuredCount}</p>
            <p className="text-xs text-[#6c757d] mt-1 font-medium">Featured</p>
          </div>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6c757d]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search properties…" className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]">
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]">
          <option value="all">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="house">House</option>
          <option value="studio">Studio</option>
          <option value="penthouse">Penthouse</option>
          <option value="townhouse">Townhouse</option>
        </select>
        <select value={featuredFilter} onChange={e => setFeaturedFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]">
          <option value="all">All Featured</option>
          <option value="featured">Featured</option>
          <option value="not_featured">Not Featured</option>
        </select>
      </div>

      {/* Second filter row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* City filter */}
        <input
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          placeholder="Filter by city…"
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] w-40"
        />

        {/* Min price */}
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          placeholder="Min GHS/night"
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] w-36"
        />

        {/* Max price */}
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          placeholder="Max GHS/night"
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a] w-36"
        />

        {/* Bedrooms */}
        <select value={bedroomsFilter} onChange={e => setBedroomsFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]">
          <option value="any">Any Bedrooms</option>
          <option value="1+">1+ Bedrooms</option>
          <option value="2+">2+ Bedrooms</option>
          <option value="3+">3+ Bedrooms</option>
          <option value="4+">4+ Bedrooms</option>
          <option value="5+">5+ Bedrooms</option>
        </select>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="h-10 px-4 rounded-xl border border-[#e9ecef] text-sm text-[#6c757d] hover:border-[#c9a961] hover:text-[#c9a961] bg-white flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        )}

        <p className="h-10 flex items-center text-xs text-[#6c757d] ml-auto">
          Showing {filtered.length} of {properties.length} propert{properties.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#f8f9fa]">
                {["Property", "Type", "Price/Night", "Features", "Status", "Featured", "Bookings", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6c757d] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paginated.map(p => (
                <tr key={p.id} className="hover:bg-[#f8f9fa] transition-colors">
                  {/* Property */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#f0f0f0]">
                        <Image src={p.images[0]?.imageUrl || "/images/h1.jpg"} alt={p.title} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a1a1a] text-sm leading-snug">{p.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-[#6c757d]" />
                          <span className="text-xs text-[#6c757d]">{p.city}</span>
                        </div>
                        {p.owner && !filterOwner && (
                          <p className="text-[10px] text-[#c9a961] mt-0.5">
                            {p.owner.name ?? p.owner.email}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#adb5bd]">{p.images.length} {p.images.length === 1 ? "image" : "images"}</span>
                          {p.hasVirtualTour && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-semibold border border-purple-100">
                              360°
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <TypeBadge type={p.propertyType} />
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-[#c9a961]">{formatCurrency(Number(p.pricePerNight))}</span>
                  </td>

                  {/* Features */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-[#6c757d]">
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5 text-[#adb5bd]" />
                        {p.bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5 text-[#adb5bd]" />
                        {p.bathrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-[#adb5bd]" />
                        {p.maxGuests}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>

                  {/* Featured toggle */}
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      checked={p.featured}
                      onChange={() => toggleFeatured(p.id, p.featured)}
                    />
                  </td>

                  {/* Bookings */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f0f0f0] text-[#6c757d]">
                      {p._count.bookings} {p._count.bookings === 1 ? "booking" : "bookings"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a href={`/stays/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors" title="View listing">
                        <Eye className="h-4 w-4" />
                      </a>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-[#c9a961]/10 hover:bg-[#c9a961]/20 text-[#9a7b3c] transition-colors" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                        {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#6c757d] text-sm">
                    <Home className="h-8 w-8 mx-auto mb-2 opacity-30" />No properties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={handlePageChange} />
      </div>

      {/* ── Slide-over Panel ──────────────────────────────────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={closePanel} />

          {/* Panel */}
          <div
            className="w-full max-w-2xl bg-white flex flex-col h-full shadow-2xl overflow-hidden animate-slide-in-right"
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
              <div>
                <p className="text-xs text-[#c9a961] uppercase tracking-widest font-semibold">
                  {editingId ? "Editing Property" : "New Property"}
                </p>
                <h2 className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl">
                  {form.title || "Untitled"}
                </h2>
              </div>
              <button onClick={closePanel} className="p-2 rounded-xl hover:bg-[#f0f0f0] transition-colors">
                <X className="h-5 w-5 text-[#6c757d]" />
              </button>
            </div>

            {/* Step tabs */}
            <div className="flex border-b border-[#f0f0f0] flex-shrink-0">
              {(["details", "images"] as const).map((s, i) => (
                <button
                  key={s}
                  onClick={() => { if (s === "images" && !savedPropertyId) return; setStep(s); }}
                  disabled={s === "images" && !savedPropertyId}
                  className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${step === s ? "text-[#c9a961] border-b-2 border-[#c9a961]" : "text-[#6c757d] hover:text-[#343a40]"} disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${step === s ? "bg-[#c9a961] text-white" : "bg-[#f0f0f0] text-[#6c757d]"}`}>{i + 1}</span>
                  {s === "details" ? "Details" : "Images & Media"}
                  {s === "images" && savedPropertyId && <ChevronRight className="h-3 w-3" />}
                </button>
              ))}
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === "details" ? (
                <form id="prop-form" onSubmit={handleSubmit} className="space-y-6">

                  {/* Basic Info */}
                  <div>
                    <SectionHeader icon={Tag} label="Basic Info" />
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Property Title *</label>
                        <input
                          required
                          value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
                          placeholder="e.g. Luxury 3-Bedroom Apartment in East Legon"
                          className={inputClass}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">URL Slug *</label>
                          <input
                            required
                            value={form.slug}
                            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                            placeholder="luxury-3bed-east-legon"
                            className={`${inputClass} font-mono text-xs`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Property Type *</label>
                          <select required value={form.propertyType} onChange={e => setForm(f => ({ ...f, propertyType: e.target.value }))} className={inputClass}>
                            {["apartment", "villa", "house", "studio", "penthouse", "townhouse"].map(t => (
                              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Status</label>
                          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                            {["available", "booked", "maintenance", "inactive"].map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end pb-0.5">
                          <label className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-xl border border-[#e9ecef] w-full hover:bg-[#fafafa] transition-colors">
                            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-[#c9a961]" />
                            <div>
                              <p className="text-sm font-medium text-[#343a40]">Featured</p>
                              <p className="text-xs text-[#adb5bd]">Show on homepage</p>
                            </div>
                            <Star className="h-4 w-4 text-[#c9a961] ml-auto" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <SectionHeader icon={MapPin} label="Location" />
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">City *</label>
                          <input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Accra" className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Area / Neighbourhood</label>
                          <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. East Legon" className={inputClass} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Latitude</label>
                          <input type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="5.6037" className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Longitude</label>
                          <input type="number" step="any" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="-0.1870" className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Details */}
                  <div>
                    <SectionHeader icon={BedDouble} label="Property Details" />
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Bedrooms</label>
                        <input type="number" min="0" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Bathrooms</label>
                        <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Max Guests</label>
                        <input type="number" min="1" value={form.maxGuests} onChange={e => setForm(f => ({ ...f, maxGuests: e.target.value }))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Area Size</label>
                        <input type="number" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. 1200" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Unit</label>
                        <select value={form.areaUnit} onChange={e => setForm(f => ({ ...f, areaUnit: e.target.value }))} className={inputClass}>
                          <option value="sqft">sq ft</option>
                          <option value="sqm">sq m</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <SectionHeader icon={DollarSign} label="Pricing" />
                    <div>
                      <label className="block text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-1.5">Price Per Night (GHS) *</label>
                      <input required type="number" min="0" value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))} placeholder="e.g. 500" className={inputClass} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <SectionHeader icon={FileText} label="Description" />
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the property — location highlights, interior features, nearby attractions…"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] resize-none placeholder:text-[#adb5bd]"
                    />
                  </div>

                  {/* Amenities */}
                  <div>
                    <SectionHeader icon={Wifi} label="Amenities" />
                    <div className="flex flex-wrap gap-2">
                      {AMENITIES_LIST.map(a => (
                        <button
                          type="button"
                          key={a}
                          onClick={() => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.amenities.includes(a) ? "bg-[#c9a961] text-white border-[#c9a961] shadow-sm" : "bg-white text-[#6c757d] border-[#e9ecef] hover:border-[#c9a961] hover:text-[#c9a961]"}`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                    {form.amenities.length > 0 && (
                      <p className="text-xs text-[#adb5bd] mt-2">{form.amenities.length} selected</p>
                    )}
                  </div>

                  {/* Virtual Tour */}
                  <div>
                    <SectionHeader icon={Users} label="Virtual Tour" />
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-xl border border-[#e9ecef] hover:bg-[#fafafa] transition-colors">
                        <input type="checkbox" checked={form.hasVirtualTour} onChange={e => setForm(f => ({ ...f, hasVirtualTour: e.target.checked }))} className="w-4 h-4 accent-[#c9a961]" />
                        <span className="text-sm font-medium text-[#343a40]">Enable Virtual Tour</span>
                      </label>
                      {form.hasVirtualTour && (
                        <input
                          value={form.virtualTourUrl}
                          onChange={e => setForm(f => ({ ...f, virtualTourUrl: e.target.value }))}
                          placeholder="https://my.matterport.com/show/?m=... or YouTube URL"
                          className={inputClass}
                        />
                      )}
                    </div>
                  </div>

                  {/* Lodgify Integration */}
                  <div>
                    <SectionHeader icon={Tag} label="Lodgify Integration" />
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] mb-1">Lodgify Property ID</label>
                        <input
                          value={form.lodgifyPropertyId}
                          onChange={e => setForm(f => ({ ...f, lodgifyPropertyId: e.target.value }))}
                          placeholder="e.g. 123456"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6c757d] mb-1">Lodgify Room Type ID</label>
                        <input
                          value={form.lodgifyRoomTypeId}
                          onChange={e => setForm(f => ({ ...f, lodgifyRoomTypeId: e.target.value }))}
                          placeholder="e.g. 789012"
                          className={inputClass}
                        />
                        <p className="text-xs text-[#adb5bd] mt-1">When set, availability is synced from Lodgify calendar.</p>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <ImagePanel
                  propertyId={savedPropertyId!}
                  onDone={closePanel}
                />
              )}
            </div>

            {/* Panel footer */}
            {step === "details" && (
              <div className="flex gap-3 px-6 py-4 border-t border-[#f0f0f0] flex-shrink-0 bg-[#fafafa]">
                <Button type="button" variant="gold-outline" onClick={closePanel} className="flex-1">Cancel</Button>
                <Button type="submit" form="prop-form" variant="gold" className="flex-1 gap-2" disabled={saving}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                  ) : editingId ? (
                    <>Save Changes <ChevronRight className="h-4 w-4" /></>
                  ) : (
                    <>Create & Add Images <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
