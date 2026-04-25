"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, ShoppingBag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Property { id: string; title: string; }
interface Service {
  id: string;
  propertyId: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "transport", label: "Transport" },
  { value: "catering", label: "Catering" },
  { value: "cleaning", label: "Cleaning" },
  { value: "experience", label: "Experiences" },
];

const emptyForm = { name: "", description: "", price: "", category: "general", propertyId: "" };

export default function OwnerServicesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState("");
  const [filterProperty, setFilterProperty] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    // Load owner's properties
    fetch("/api/owner/submissions")
      .then(r => r.json())
      .catch(() => ({ submissions: [] }));

    // Load properties via admin properties API isn't available to owners, so use a dedicated endpoint
    fetch("/api/owner/properties-list")
      .then(r => r.json())
      .then(d => { if (d.properties) setProperties(d.properties); })
      .catch(() => {});

    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      // Fetch services for all owned properties
      const res = await fetch("/api/services/owner");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyId || !form.name || !form.price) return;
    setSaving(true);
    try {
      const url = editId ? `/api/services/${editId}` : "/api/services";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      });
      const data = await res.json();
      if (data.service) {
        if (editId) {
          setServices(s => s.map(x => x.id === editId ? data.service : x));
          showToast("Service updated!");
        } else {
          setServices(s => [data.service, ...s]);
          showToast("Service added!");
        }
        setShowForm(false);
        setEditId(null);
        setForm(emptyForm);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE" });
      setServices(s => s.filter(x => x.id !== id));
      showToast("Service deleted.");
    } finally { setDeleting(null); }
  };

  const openEdit = (svc: Service) => {
    setForm({ name: svc.name, description: svc.description || "", price: String(svc.price), category: svc.category, propertyId: svc.propertyId });
    setEditId(svc.id);
    setShowForm(true);
  };

  const filtered = filterProperty ? services.filter(s => s.propertyId === filterProperty) : services;

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-lg">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm text-green-800">{toast}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Revenue</p>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Pre-Arrival Services</h1>
          <p className="text-[#6c757d] text-sm mt-1">Add services guests can book during checkout — airport transfers, catering, cleaning and more.</p>
        </div>
        <Button variant="gold" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-6 mb-8">
          <h2 className="font-['Playfair_Display'] font-semibold text-[#1a1a1a] text-xl mb-5">
            {editId ? "Edit Service" : "New Service"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[#6c757d] mb-1">Property *</label>
              <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))} required
                className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white">
                <option value="">Select property</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[#6c757d] mb-1">Service Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Airport Pickup"
                className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6c757d] mb-1">Price (GHS) *</label>
              <input type="number" min={0} step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required placeholder="0.00"
                className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#6c757d] mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description of the service…"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] resize-none" />
            </div>
            <div className="col-span-2 flex gap-3">
              <Button type="submit" variant="gold" disabled={saving} className="gap-2">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : editId ? "Update" : "Add Service"}
              </Button>
              <Button type="button" variant="gold-outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      {properties.length > 1 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-[#6c757d]">Filter by property:</span>
          <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white">
            <option value="">All properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}

      {/* Services List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-[#6c757d]">
          <Loader2 className="h-6 w-6 animate-spin text-[#c9a961]" /> Loading services…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e9ecef] p-16 text-center">
          <ShoppingBag className="h-12 w-12 text-[#e9ecef] mx-auto mb-4" />
          <p className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] mb-2">No services yet</p>
          <p className="text-[#6c757d] text-sm mb-6">Add services guests can purchase during checkout — airport transfers, catering, cleaning and more.</p>
          <Button variant="gold" onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Add First Service</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fa] text-[#6c757d] text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Service</th>
                <th className="px-5 py-3 text-left font-medium">Category</th>
                <th className="px-5 py-3 text-left font-medium">Price</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8f9fa]">
              {filtered.map(svc => (
                <tr key={svc.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#1a1a1a]">{svc.name}</p>
                    {svc.description && <p className="text-[#6c757d] text-xs mt-0.5 line-clamp-1">{svc.description}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="capitalize text-[#343a40] text-xs bg-[#f8f9fa] px-2 py-0.5 rounded-full">{svc.category}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#c9a961]">{formatCurrency(Number(svc.price))}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${svc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {svc.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(svc)} className="w-8 h-8 rounded-lg border border-[#e9ecef] flex items-center justify-center text-[#6c757d] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(svc.id)} disabled={deleting === svc.id} className="w-8 h-8 rounded-lg border border-[#e9ecef] flex items-center justify-center text-[#6c757d] hover:border-red-400 hover:text-red-400 transition-colors">
                        {deleting === svc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
