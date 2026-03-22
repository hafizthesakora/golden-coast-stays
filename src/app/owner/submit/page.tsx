"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, Upload, Info, ImagePlus, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const PROPERTY_TYPES = ["apartment", "villa", "house", "studio", "penthouse", "townhouse"];
const AMENITIES_LIST = [
  "WiFi", "Air Conditioning", "Swimming Pool", "Parking", "Kitchen",
  "Generator", "Security", "Gym", "DSTV", "Balcony", "Garden",
  "Washer", "BBQ Grill", "Elevator", "Concierge",
];

interface ImagePreview {
  file: File;
  url: string;
}

export default function SubmitPropertyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionRef, setSubmissionRef] = useState("");
  const [error, setError] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as { name?: string; email?: string } | undefined;

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    propertyType: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    maxGuests: "",
    priceEstimate: "",
    description: "",
    message: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleAmenity = (a: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 8 - images.length;
    const toAdd = files.slice(0, remaining);
    const newPreviews: ImagePreview[] = toAdd.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newPreviews]);
    // reset input so same files can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      // fields
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("amenities", JSON.stringify(selectedAmenities));
      // images
      images.forEach((img) => fd.append("images", img.file));

      const res = await fetch("/api/owner/submissions", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmissionRef(data.submission.submissionRef);
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setSubmitted(false);
    setForm({
      fullName: user?.name || "",
      email: user?.email || "",
      phone: "",
      propertyType: "",
      location: "",
      bedrooms: "",
      bathrooms: "",
      maxGuests: "",
      priceEstimate: "",
      description: "",
      message: "",
    });
    setSelectedAmenities([]);
  };

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-12 text-center max-w-md w-full shadow-sm">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a] mb-2">
            Submission Received!
          </h2>
          <p className="text-[#6c757d] mb-1">Your property has been submitted for review.</p>
          <p className="text-[#6c757d] text-sm mb-6">
            Reference: <span className="font-semibold text-[#c9a961]">{submissionRef}</span>
          </p>
          <div className="bg-[#f8f9fa] rounded-xl p-4 text-left text-sm text-[#343a40] mb-6 space-y-2">
            <p className="font-semibold text-[#1a1a1a]">What happens next?</p>
            <p>✓ Our team reviews your submission within 48 hours</p>
            <p>✓ We may reach out to arrange a property walkthrough</p>
            <p>✓ Once approved, your listing goes live immediately</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#e9ecef] text-sm font-medium text-[#343a40] hover:bg-[#f8f9fa] transition-colors"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push("/owner/submissions")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#c9a961] text-white text-sm font-semibold hover:bg-[#9a7b3c] transition-colors"
            >
              View Submissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%)" }}
    >
      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/50 px-8 py-5 sticky top-0 z-20 shadow-sm">
        <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold mb-0.5">Owner Portal</p>
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#1a1a1a]">Submit a Property</h1>
      </div>

      <div className="p-6 lg:p-8 max-w-3xl mx-auto">

        <p className="text-[#6c757d] mb-6">
          Fill in the details below and our team will review your submission within 48 hours.
        </p>

        {/* Info banner */}
        <div className="flex gap-3 p-4 bg-[#c9a961]/8 border border-[#c9a961]/20 rounded-xl mb-6">
          <Info className="h-5 w-5 text-[#c9a961] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#343a40]">
            Once approved, your property will be professionally photographed, listed across all our
            channels, and managed end-to-end by our team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* ── Step 1: Contact Info ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
            <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c9a961] text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              Your Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Full Name *</label>
                <input
                  required
                  value={form.fullName}
                  onChange={set("fullName")}
                  placeholder="Kwame Asante"
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Email Address *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@email.com"
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+233 ..."
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Step 2: Property Details ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
            <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c9a961] text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              Property Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Property Type</label>
                <select
                  value={form.propertyType}
                  onChange={set("propertyType")}
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                >
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                  Location / Address *
                </label>
                <input
                  required
                  value={form.location}
                  onChange={set("location")}
                  placeholder="East Legon, Accra"
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Bedrooms</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.bedrooms}
                  onChange={set("bedrooms")}
                  placeholder="3"
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Bathrooms</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.bathrooms}
                  onChange={set("bathrooms")}
                  placeholder="2"
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">Max Guests</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.maxGuests}
                  onChange={set("maxGuests")}
                  placeholder="6"
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                  Est. Price / Night (GHS)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.priceEstimate}
                  onChange={set("priceEstimate")}
                  placeholder="1200"
                  className="w-full h-11 px-4 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Step 3: Photos ───────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
            <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c9a961] text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              Property Photos
            </h3>
            <p className="text-[#6c757d] text-sm mb-4 ml-8">
              Upload up to 8 photos. High-quality images help get your property approved faster.
            </p>

            {/* Upload trigger */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            {images.length < 8 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 rounded-xl border-2 border-dashed border-[#e9ecef] hover:border-[#c9a961] hover:bg-[#c9a961]/4 transition-all flex flex-col items-center justify-center gap-2 text-[#6c757d] hover:text-[#c9a961] group mb-4"
              >
                <ImagePlus className="h-6 w-6 group-hover:text-[#c9a961]" />
                <span className="text-sm font-medium">
                  Click to add photos ({images.length}/8)
                </span>
              </button>
            )}

            {/* Image previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[#e9ecef] group"
                  >
                    <Image
                      src={img.url}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-[#c9a961] text-white font-semibold">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {images.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#e9ecef] hover:border-[#c9a961] flex items-center justify-center text-[#adb5bd] hover:text-[#c9a961] transition-all"
                  >
                    <ImagePlus className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Step 4: Amenities ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
            <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c9a961] text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedAmenities.includes(a)
                      ? "bg-[#c9a961] border-[#c9a961] text-white"
                      : "bg-white border-[#e9ecef] text-[#343a40] hover:border-[#c9a961] hover:text-[#c9a961]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 5: Description & Notes ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">
            <h3 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#c9a961] text-white text-xs font-bold flex items-center justify-center">
                5
              </span>
              Description & Notes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                  Property Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Describe your property — layout, style, standout features, what makes it special..."
                  className="w-full px-4 py-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] resize-y transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343a40] mb-1.5">
                  Additional Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Any special considerations, availability info, or questions for our team..."
                  className="w-full px-4 py-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a961]/30 focus:border-[#c9a961] resize-y transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#c9a961] text-white font-semibold hover:bg-[#9a7b3c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            {loading ? "Uploading & Submitting..." : "Submit Property for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
