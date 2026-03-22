"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, Users, Shield, UserX, Plus, Eye, Trash2, Loader2, X,
  CheckCircle, Lock, Unlock, ChevronDown, Calendar, Heart, Phone, Mail,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  isSuspended: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { bookings: number; favorites: number };
}

const PER_PAGE = 10;

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">Admin</Badge>;
  if (role === "owner") return <Badge variant="gold">Owner</Badge>;
  return <Badge variant="info">Guest</Badge>;
}

function StatusBadge({ isSuspended }: { isSuspended: boolean }) {
  if (isSuspended) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <Lock className="h-3 w-3" /> Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle className="h-3 w-3" /> Active
    </span>
  );
}

interface ToastProps { message: string; onDone: () => void }
function Toast({ message, onDone }: ToastProps) {
  setTimeout(onDone, 3000);
  return (
    <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-white border border-[#e9ecef] rounded-2xl px-5 py-4 shadow-2xl animate-in slide-in-from-top-2">
      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
      <p className="text-sm font-medium text-[#1a1a1a]">{message}</p>
    </div>
  );
}

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

export default function UsersAdminClient({ users: initialUsers }: { users: User[] }) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "owner" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "bookings">("newest");
  const [joinFrom, setJoinFrom] = useState("");
  const [joinTo, setJoinTo] = useState("");
  const [bookingCountFilter, setBookingCountFilter] = useState("any");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", phone: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const isFiltered =
    search !== "" ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "newest" ||
    joinFrom !== "" ||
    joinTo !== "" ||
    bookingCountFilter !== "any";

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
    setJoinFrom("");
    setJoinTo("");
    setBookingCountFilter("any");
  };

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, sortBy, joinFrom, joinTo, bookingCountFilter]);

  const handlePageChange = (p: number) => {
    setPage(p);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Derived stats
  const totalUsers = users.length;
  const ownerCount = users.filter(u => u.role === "owner").length;
  const guestCount = users.filter(u => u.role === "user").length;
  const suspendedCount = users.filter(u => u.isSuspended).length;

  // Filtered + sorted list
  const filtered = useMemo(() => {
    return users
      .filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || (u.name || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && !u.isSuspended) ||
          (statusFilter === "suspended" && u.isSuspended);

        const joinedDate = new Date(u.createdAt).getTime();
        const matchJoinFrom = !joinFrom || joinedDate >= new Date(joinFrom).getTime();
        const matchJoinTo = !joinTo || joinedDate <= new Date(joinTo).getTime();

        const minBookings = bookingCountFilter === "any" ? 0 : Number(bookingCountFilter.replace("+", ""));
        const matchBookings = bookingCountFilter === "any" || u._count.bookings >= minBookings;

        return matchSearch && matchRole && matchStatus && matchJoinFrom && matchJoinTo && matchBookings;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "name") return (a.name || a.email).localeCompare(b.name || b.email);
        if (sortBy === "bookings") return b._count.bookings - a._count.bookings;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [users, search, roleFilter, statusFilter, sortBy, joinFrom, joinTo, bookingCountFilter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page]
  );

  const showToast = (msg: string) => setToast(msg);

  // Toggle suspend
  const toggleSuspend = async (user: User) => {
    setToggling(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !user.isSuspended }),
      });
      const data = await res.json();
      if (data.user) {
        setUsers(us => us.map(u => u.id === user.id ? { ...u, isSuspended: data.user.isSuspended } : u));
        if (selectedUser?.id === user.id) setSelectedUser(s => s ? { ...s, isSuspended: data.user.isSuspended } : s);
        showToast(data.user.isSuspended ? "User suspended" : "User activated");
      }
    } finally {
      setToggling(null);
    }
  };

  // Change role
  const changeRole = async (user: User, newRole: string) => {
    setEditingRole(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.user) {
        setUsers(us => us.map(u => u.id === user.id ? { ...u, role: data.user.role } : u));
        if (selectedUser?.id === user.id) setSelectedUser(s => s ? { ...s, role: data.user.role } : s);
        showToast("Role updated");
      }
    } finally {
      setEditingRole(null);
    }
  };

  // Delete user
  const deleteUser = async (user: User) => {
    setDeleting(user.id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsers(us => us.filter(u => u.id !== user.id));
        if (selectedUser?.id === user.id) setSelectedUser(null);
        showToast("User deleted");
      }
    } finally {
      setDeleting(null);
    }
  };

  // Add user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.user) {
        setUsers(us => [data.user, ...us]);
        setShowAddModal(false);
        setAddForm({ name: "", email: "", password: "", phone: "", role: "user" });
        showToast("User created successfully");
      }
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Owners", value: ownerCount, icon: Shield, color: "text-[#c9a961]", bg: "bg-[#c9a961]/10" },
    { label: "Guests", value: guestCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Suspended", value: suspendedCount, icon: UserX, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Slide-in animation keyframe */}
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#c9a961] font-semibold text-sm tracking-widest uppercase mb-1">Manage</p>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#1a1a1a]">Users</h1>
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e9ecef] p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="font-['Playfair_Display'] font-bold text-[#1a1a1a] text-xl">{s.value}</p>
              <p className="text-[#6c757d] text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar — row 1 */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6c757d]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as typeof roleFilter)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
        >
          <option value="all">All Roles</option>
          <option value="user">Guest</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">By Name</option>
          <option value="bookings">Most Bookings</option>
        </select>
      </div>

      {/* Filter Bar — row 2 */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Join date from */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-[#6c757d] font-medium">
            Joined From
          </label>
          <input
            type="date"
            value={joinFrom}
            onChange={e => setJoinFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
          />
        </div>

        {/* Join date to */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-[#6c757d] font-medium">
            Joined To
          </label>
          <input
            type="date"
            value={joinTo}
            onChange={e => setJoinTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
          />
        </div>

        {/* Booking count filter */}
        <select
          value={bookingCountFilter}
          onChange={e => setBookingCountFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white text-[#1a1a1a]"
        >
          <option value="any">Any Bookings</option>
          <option value="1+">1+ Bookings</option>
          <option value="3+">3+ Bookings</option>
          <option value="5+">5+ Bookings</option>
          <option value="10+">10+ Bookings</option>
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
          Showing {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-[#e9ecef] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#f8f9fa]">
                {["User", "Phone", "Role", "Bookings", "Favorites", "Last Login", "Joined", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6c757d] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {paginated.map(u => (
                <tr key={u.id} className="hover:bg-[#f8f9fa] transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(u.name || u.email)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1a1a1a] text-sm leading-tight">{u.name || "—"}</p>
                        <p className="text-xs text-[#6c757d] leading-tight">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Phone */}
                  <td className="px-4 py-3 text-sm text-[#6c757d] whitespace-nowrap">{u.phone || "—"}</td>
                  {/* Role */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <RoleBadge role={u.role} />
                      <div className="relative">
                        <button
                          className="p-1 rounded hover:bg-[#f0f0f0] transition-colors"
                          onClick={() => setEditingRole(editingRole === `role-${u.id}` ? null : `role-${u.id}`)}
                          title="Change role"
                        >
                          <ChevronDown className="h-3 w-3 text-[#6c757d]" />
                        </button>
                        {editingRole === `role-${u.id}` && (
                          <div className="absolute top-7 left-0 z-20 bg-white border border-[#e9ecef] rounded-xl shadow-lg py-1 min-w-[110px]">
                            {["user", "owner", "admin"].filter(r => r !== u.role).map(r => (
                              <button
                                key={r}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-[#f8f9fa] capitalize text-[#1a1a1a]"
                                onClick={() => { setEditingRole(null); changeRole(u, r); }}
                              >
                                {r === "user" ? "Guest" : r.charAt(0).toUpperCase() + r.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Bookings */}
                  <td className="px-4 py-3 text-sm text-[#6c757d] text-center">{u._count.bookings}</td>
                  {/* Favorites */}
                  <td className="px-4 py-3 text-sm text-[#6c757d] text-center">{u._count.favorites}</td>
                  {/* Last Login */}
                  <td className="px-4 py-3 text-xs text-[#6c757d] whitespace-nowrap">{relativeTime(u.lastLoginAt)}</td>
                  {/* Joined */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-[#6c757d] whitespace-nowrap">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3"><StatusBadge isSuspended={u.isSuspended} /></td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* View details */}
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="p-2 rounded-lg hover:bg-[#f0f0f0] transition-colors text-[#6c757d] hover:text-[#1a1a1a]"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {/* Suspend / Activate */}
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={toggling === u.id}
                        className={`p-2 rounded-lg transition-colors ${u.isSuspended ? "hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700" : "hover:bg-red-50 text-red-500 hover:text-red-600"}`}
                        title={u.isSuspended ? "Activate user" : "Suspend user"}
                      >
                        {toggling === u.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : u.isSuspended ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />
                        }
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDelete(u)}
                        disabled={deleting === u.id}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                        title="Delete user"
                      >
                        {deleting === u.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#6c757d] text-sm">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onChange={handlePageChange} />
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#f0f0f0]">
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1a1a]">Add User</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-[#f0f0f0] transition-colors">
                <X className="h-5 w-5 text-[#6c757d]" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider block mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider block mb-1">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider block mb-1">Phone</label>
                <input
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider block mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[#e9ecef] text-sm focus:outline-none focus:border-[#c9a961] bg-white"
                >
                  <option value="user">Guest</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" size="sm" className="flex-1" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-['Playfair_Display'] text-lg font-bold text-[#1a1a1a] mb-2">Delete User?</h2>
            <p className="text-sm text-[#6c757d] mb-6">
              Are you sure you want to delete <strong>{confirmDelete.name || confirmDelete.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={() => deleteUser(confirmDelete)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Slide-over Panel */}
      {selectedUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          />
          <div
            className="fixed right-0 top-0 h-full w-full max-w-[400px] z-50 bg-white shadow-2xl flex flex-col overflow-y-auto"
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0] flex-shrink-0">
              <h2 className="font-['Playfair_Display'] text-lg font-bold text-[#1a1a1a]">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-lg hover:bg-[#f0f0f0] transition-colors"
              >
                <X className="h-5 w-5 text-[#6c757d]" />
              </button>
            </div>

            {/* Avatar + identity */}
            <div className="px-6 py-6 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {getInitials(selectedUser.name || selectedUser.email)}
                </div>
                <div>
                  <p className="font-semibold text-[#1a1a1a] text-base leading-tight">{selectedUser.name || "No name"}</p>
                  <p className="text-sm text-[#6c757d] leading-tight">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <RoleBadge role={selectedUser.role} />
                    <StatusBadge isSuspended={selectedUser.isSuspended} />
                  </div>
                </div>
              </div>
              {selectedUser.phone && (
                <div className="flex items-center gap-2 text-sm text-[#6c757d]">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  {selectedUser.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-[#6c757d] mt-1">
                <Mail className="h-4 w-4 flex-shrink-0" />
                {selectedUser.email}
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 py-5 border-b border-[#f0f0f0]">
              <p className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-3">Stats</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Calendar, label: "Total Bookings", value: selectedUser._count.bookings },
                  { icon: Heart, label: "Favorites", value: selectedUser._count.favorites },
                ].map(s => (
                  <div key={s.label} className="bg-[#f8f9fa] rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className="h-4 w-4 text-[#c9a961]" />
                      <p className="text-xs text-[#6c757d]">{s.label}</p>
                    </div>
                    <p className="font-bold text-[#1a1a1a] text-lg">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#f8f9fa] rounded-xl p-3">
                  <p className="text-xs text-[#6c757d] mb-1">Member Since</p>
                  <p className="text-sm font-semibold text-[#1a1a1a]">
                    {new Date(selectedUser.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="bg-[#f8f9fa] rounded-xl p-3">
                  <p className="text-xs text-[#6c757d] mb-1">Last Login</p>
                  <p className="text-sm font-semibold text-[#1a1a1a]">{relativeTime(selectedUser.lastLoginAt)}</p>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="px-6 py-5 border-b border-[#f0f0f0]">
              <p className="text-xs font-semibold text-[#6c757d] uppercase tracking-wider mb-3">Activity</p>
              {selectedUser._count.bookings > 0 ? (
                <div className="flex items-center gap-3 bg-[#f8f9fa] rounded-xl p-3">
                  <Calendar className="h-5 w-5 text-[#c9a961] flex-shrink-0" />
                  <p className="text-sm text-[#1a1a1a]">
                    <span className="font-semibold">{selectedUser._count.bookings}</span> booking{selectedUser._count.bookings !== 1 ? "s" : ""} made
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#6c757d]">No recent activity</p>
              )}
            </div>

            {/* Panel actions */}
            <div className="px-6 py-5 mt-auto flex flex-col gap-3 flex-shrink-0">
              <button
                onClick={() => toggleSuspend(selectedUser)}
                disabled={toggling === selectedUser.id}
                className={`w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  selectedUser.isSuspended
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                }`}
              >
                {toggling === selectedUser.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : selectedUser.isSuspended
                    ? <><Unlock className="h-4 w-4" /> Activate User</>
                    : <><Lock className="h-4 w-4" /> Suspend User</>
                }
              </button>
              <button
                onClick={() => { setSelectedUser(null); setConfirmDelete(selectedUser); }}
                className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete User
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
