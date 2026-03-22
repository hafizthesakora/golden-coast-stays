"use client";

import { useState } from "react";
import Image from "next/image";
import { useRef } from "react";
import {
  Plus, Edit2, Trash2, Loader2, X, CheckCircle, MapPin, Calendar,
  Users, Clock, Play, Link2, Home, Globe, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tour {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  meetingPoint: string;
  maxParticipants: number;
  price: number;
  image: string | null;
  isActive: boolean;
  _count: { registrations: number };
}

interface Property {
  id: string;
  title: string;
  city: string;
  propertyType: string;
  hasVirtualTour: boolean;
  virtualTourUrl: string | null;
  images: { imageUrl: string }[];
}

const emptyTourForm = {
  title: "", slug: "", description: "", date: "", time: "10:00",
  duration: "3 hours", meetingPoint: "", maxParticipants: "20", price: "0", isActive: true,
  imageUrl: "",
};

// ─── Tour form helpers ────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Virtual Tours Tab ────────────────────────────────────────────────────────
function VirtualToursTab({ properties: initial }: { properties: Property[] }) {
  const [properties, setProperties] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "none">("all");
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);

  const filtered = properties.filter(p => {
    if (filter === "active") return p.hasVirtualTour;
    if (filter === "none") return !p.hasVirtualTour;
    return true;
  });

  const openEdit = (p: Property) => {
    setEditing(p.id);
    setUrlInput(p.virtualTourUrl || "");
  };

  const cancelEdit = () => { setEditing(null); setUrlInput(""); };

  const saveVirtualTour = async (id: string, url: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasVirtualTour: !!url, virtualTourUrl: url || null }),
      });
      if (res.ok) {
        setProperties(ps => ps.map(p => p.id === id ? { ...p, hasVirtualTour: !!url, virtualTourUrl: url || null } : p));
        setEditing(null);
        setSuccess(url ? "Virtual tour saved!" : "Virtual tour removed.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } finally {
      setSaving(null);
    }
  };

  // Convert YouTube/Matterport/generic URL to embeddable
  function toEmbedUrl(url: string): string | null {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    if (url.includes("matterport.com")) return url;
    if (url.startsWith("http")) return url;
    return null;
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-500" /><p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-gradient-to-r from-[#c9a961]/10 to-[#9a7b3c]/5 border border-[#c9a961]/30 rounded-2xl p-4 flex items-start gap-3">
        <Globe className="h-5 w-5 text-[#c9a961] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#1a1a1a] text-sm">Virtual Tour URLs</p>
          <p className="text-[#6c757d] text-xs mt-0.5">
            Supports Matterport 360° links, YouTube videos, iFrame embed URLs, or any direct tour link.
            Guests will see an embedded preview on the property page.
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {([["all", "All Properties"], ["active", "Has Tour"], ["none", "No Tour"]] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === v ? "bg-[#1a1a1a] text-white" : "bg-white border border-[#e9ecef] text-[#6c757d] hover:bg-[#f8f9fa]"}`}
          >
            {l}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === v ? "bg-white/20" : "bg-[#f0f0f0]"}`}>
              {v === "all" ? properties.length : v === "active" ? properties.filter(p => p.hasVirtualTour).length : properties.filter(p => !p.hasVirtualTour).length}
            </span>
          </button>
        ))}
      </div>

      {/* Property cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(p => {
          const isEditing = editing === p.id;
          const img = p.images[0]?.imageUrl || "/images/h1.jpg";

          return (
            <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${p.hasVirtualTour ? "border-[#c9a961]/40 shadow-sm" : "border-[#e9ecef]"}`}>
              {/* Thumbnail */}
              <div className="relative h-40 overflow-hidden group">
                <Image src={img} alt={p.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {p.hasVirtualTour && p.virtualTourUrl && (
                  <button
                    onClick={() => setPreviewProperty(p)}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    aria-label={`Preview virtual tour for ${p.title}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/35 transition-all duration-200 shadow-lg">
                      <Play className="h-6 w-6 text-white fill-white ml-1" />
                    </div>
                  </button>
                )}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.hasVirtualTour ? "bg-[#c9a961] text-white" : "bg-white/80 text-[#6c757d]"}`}>
                    {p.hasVirtualTour ? "360° Active" : "No Tour"}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                  <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-white/70 text-xs capitalize">{p.propertyType} · {p.city}</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#343a40] mb-1.5">Tour Embed URL</label>
                      <input
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://my.matterport.com/show/?m=... or YouTube URL"
                        className="w-full h-9 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] placeholder:text-[#adb5bd]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#e9ecef] text-sm text-[#6c757d] hover:bg-[#f8f9fa] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={saving === p.id}
                        onClick={() => saveVirtualTour(p.id, urlInput)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] text-white text-sm font-medium disabled:opacity-60"
                      >
                        {saving === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {p.virtualTourUrl ? (
                      <div className="flex items-center gap-2 text-xs text-[#6c757d] bg-[#f8f9fa] rounded-lg px-3 py-2">
                        <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-[#c9a961]" />
                        <span className="truncate">{p.virtualTourUrl}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-[#adb5bd] italic">No virtual tour URL set.</p>
                    )}
                    <div className="flex gap-2">
                      {p.virtualTourUrl && (
                        <button
                          onClick={() => setPreviewProperty(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#c9a961] to-[#9a7b3c] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          <Play className="h-3.5 w-3.5 fill-white" />
                          Preview Tour
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(p)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#c9a961] text-[#9a7b3c] text-sm font-medium hover:bg-[#c9a961]/5 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        {p.virtualTourUrl ? "Edit URL" : "Add Tour"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#6c757d]">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No properties found.</p>
          </div>
        )}
      </div>

      {/* Fullscreen tour preview modal */}
      {previewProperty && previewProperty.virtualTourUrl && (
        <div className="fixed inset-0 z-[999] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <p className="text-white font-semibold text-sm">{previewProperty.title}</p>
              <p className="text-white/50 text-xs capitalize">{previewProperty.propertyType} · {previewProperty.city}</p>
            </div>
            <button
              onClick={() => setPreviewProperty(null)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <iframe
              src={toEmbedUrl(previewProperty.virtualTourUrl)!}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Physical Tours Tab ───────────────────────────────────────────────────────
function PhysicalToursTab({ tours: initial }: { tours: Tour[] }) {
  const [tours, setTours] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTourForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setForm(emptyTourForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setShowForm(true);
  };
  const openEdit = (t: Tour) => {
    setForm({ title: t.title, slug: t.slug, description: t.description, date: t.date.slice(0, 10), time: t.time, duration: t.duration, meetingPoint: t.meetingPoint, maxParticipants: String(t.maxParticipants), price: String(t.price), isActive: t.isActive, imageUrl: t.image || "" });
    setImageFile(null);
    setImagePreview(t.image || "");
    setEditingId(t.id);
    setShowForm(true);
  };

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadTourImage(file: File): Promise<string> {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/tours/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      return url;
    } finally {
      setUploadingImage(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tour?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/tours/${id}`, { method: "DELETE" });
      if (res.ok) { setTours(ts => ts.filter(t => t.id !== id)); setSuccess("Tour deleted."); setTimeout(() => setSuccess(""), 3000); }
    } finally { setDeleting(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      let finalImageUrl = form.imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadTourImage(imageFile);
      }
      const url = editingId ? `/api/admin/tours/${editingId}` : "/api/admin/tours";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, maxParticipants: Number(form.maxParticipants), price: Number(form.price), image: finalImageUrl || null }) });
      const data = await res.json();
      if (data.tour) {
        if (editingId) setTours(ts => ts.map(t => t.id === editingId ? { ...t, ...data.tour } : t));
        else setTours(ts => [{ ...data.tour, _count: { registrations: 0 } }, ...ts]);
        setShowForm(false);
        setSuccess(editingId ? "Tour updated!" : "Tour created!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-500" /><p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="gold" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Tour</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-40">
              <Image src={t.image || "/images/h3.jpg"} alt={t.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 right-3">
                <Badge variant={t.isActive ? "success" : "danger"}>{t.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] mb-2">{t.title}</h3>
              <div className="space-y-1.5 text-xs text-[#6c757d]">
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#c9a961]" />{new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#c9a961]" />{t.time} · {t.duration}</div>
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#c9a961]" />{t.meetingPoint}</div>
                <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[#c9a961]" />{t._count.registrations} / {t.maxParticipants} registered</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="gold-outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(t)}><Edit2 className="h-3.5 w-3.5" />Edit</Button>
                <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 text-sm transition-colors">
                  {deleting === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {tours.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#6c757d]">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No guided tours yet. Add your first tour.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#f0f0f0]">
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl">{editingId ? "Edit Tour" : "Add Tour"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[#f0f0f0]"><X className="h-5 w-5 text-[#6c757d]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Tour Photo</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#e9ecef] h-36">
                    <img src={imagePreview} alt="Tour" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(""); setForm(f => ({ ...f, imageUrl: "" })); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-[#e9ecef] rounded-xl p-6 text-center cursor-pointer hover:border-[#c9a961]/60 transition-colors"
                  >
                    <Upload className="h-7 w-7 text-[#c9a961] mx-auto mb-2" />
                    <p className="text-sm text-[#6c757d]">Click to upload tour photo</p>
                    <p className="text-xs text-[#adb5bd] mt-0.5">JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Slug *</label>
                <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#343a40] mb-1.5">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343a40] mb-1.5">Time *</label>
                  <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343a40] mb-1.5">Duration</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3 hours" className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343a40] mb-1.5">Max Participants</label>
                  <input type="number" min="1" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Meeting Point</label>
                <input value={form.meetingPoint} onChange={e => setForm(f => ({ ...f, meetingPoint: e.target.value }))} placeholder="e.g. Golden Coast Office, East Legon" className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#c9a961]" />
                <span className="text-sm font-medium text-[#343a40]">Active (visible to public)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="gold-outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                <Button type="submit" variant="gold" className="flex-1 gap-2" disabled={saving || uploadingImage}>
                  {(saving || uploadingImage) ? <><Loader2 className="h-4 w-4 animate-spin" />{uploadingImage ? "Uploading…" : "Saving…"}</> : <>{editingId ? "Update" : "Create"} Tour</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ToursAdminClient({
  tours,
  properties,
}: {
  tours: Tour[];
  properties: Property[];
}) {
  const [tab, setTab] = useState<"virtual" | "physical">("virtual");
  const activeVirtualTours = properties.filter(p => p.hasVirtualTour).length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Manage</p>
        <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Tours & Virtual Tours</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Virtual Tours Active", value: activeVirtualTours, icon: Globe, bg: "bg-[#c9a961]/10", color: "text-[#9a7b3c]" },
          { label: "Properties w/ Tours", value: properties.filter(p => p.virtualTourUrl).length, icon: Home, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Guided Tours", value: tours.length, icon: MapPin, bg: "bg-purple-50", color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e9ecef] p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl leading-none">{s.value}</p>
              <p className="text-[#6c757d] text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f0f0f0] p-1 rounded-2xl w-fit mb-6">
        <button
          onClick={() => setTab("virtual")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "virtual" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#6c757d] hover:text-[#1a1a1a]"}`}
        >
          <Play className="h-4 w-4" /> Virtual Tours (360°)
        </button>
        <button
          onClick={() => setTab("physical")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "physical" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#6c757d] hover:text-[#1a1a1a]"}`}
        >
          <MapPin className="h-4 w-4" /> Guided Tours
        </button>
      </div>

      {tab === "virtual" ? (
        <VirtualToursTab properties={properties} />
      ) : (
        <PhysicalToursTab tours={tours} />
      )}
    </div>
  );
}
