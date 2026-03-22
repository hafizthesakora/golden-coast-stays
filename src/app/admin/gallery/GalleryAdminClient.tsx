"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, Loader2, Upload, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string;
  order: number;
}

const CATEGORIES = ["All", "Interior", "Exterior", "Amenities", "Views"];

export default function GalleryAdminClient({ images: initial }: { images: GalleryImage[] }) {
  const [images, setImages] = useState(initial);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [uploadForm, setUploadForm] = useState({ caption: "", category: "Interior" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = activeCategory === "All" ? images : images.filter(i => i.category === activeCategory);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("caption", uploadForm.caption);
      fd.append("category", uploadForm.category);
      const res = await fetch("/api/admin/gallery", { method: "POST", body: fd });
      const data = await res.json();
      if (data.image) {
        setImages(imgs => [data.image, ...imgs]);
        setShowUpload(false);
        setSelectedFile(null);
        setPreview(null);
        setUploadForm({ caption: "", category: "Interior" });
        setSuccess("Image uploaded!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      if (res.ok) { setImages(imgs => imgs.filter(i => i.id !== id)); setSuccess("Image deleted."); setTimeout(() => setSuccess(""), 3000); }
    } finally { setDeleting(null); }
  };

  return (
    <div className="p-6 lg:p-8">
      {success && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-500" /><p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Manage</p>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Gallery</h1>
        </div>
        <Button variant="gold" onClick={() => setShowUpload(true)} className="gap-2"><Plus className="h-4 w-4" />Upload Image</Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === c ? "bg-[#c9a961] text-white" : "bg-white border border-[#e9ecef] text-[#6c757d] hover:border-[#c9a961]"}`}
          >
            {c} {c === "All" ? `(${images.length})` : `(${images.filter(i => i.category === c).length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(img => (
          <div key={img.id} className="group relative rounded-2xl overflow-hidden bg-[#f8f9fa] border border-[#e9ecef] aspect-square">
            <Image src={img.imageUrl} alt={img.caption || "Gallery"} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDelete(img.id)}
                disabled={deleting === img.id}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
              >
                {deleting === img.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
            {img.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2">
                <p className="text-white text-xs truncate">{img.caption}</p>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <span className="bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{img.category}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#6c757d]">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No images in this category</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[#f0f0f0]">
              <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl">Upload Image</h2>
              <button onClick={() => { setShowUpload(false); setPreview(null); setSelectedFile(null); }} className="p-2 rounded-lg hover:bg-[#f0f0f0]"><X className="h-5 w-5 text-[#6c757d]" /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* File drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#e9ecef] hover:border-[#c9a961] rounded-xl p-6 text-center cursor-pointer transition-colors relative overflow-hidden"
              >
                {preview ? (
                  <div className="relative h-32">
                    <Image src={preview} alt="Preview" fill className="object-contain" />
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-[#c9a961] mx-auto mb-2" />
                    <p className="text-sm text-[#6c757d]">Click to select image</p>
                    <p className="text-xs text-[#adb5bd] mt-1">JPG, PNG, WebP — max 10MB</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Caption</label>
                <input value={uploadForm.caption} onChange={e => setUploadForm(f => ({ ...f, caption: e.target.value }))} placeholder="Optional caption…" className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Category</label>
                <select value={uploadForm.category} onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]">
                  {["Interior", "Exterior", "Amenities", "Views"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="gold-outline" onClick={() => { setShowUpload(false); setPreview(null); setSelectedFile(null); }} className="flex-1">Cancel</Button>
                <Button type="submit" variant="gold" className="flex-1 gap-2" disabled={uploading || !selectedFile}>
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="h-4 w-4" />Upload</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
