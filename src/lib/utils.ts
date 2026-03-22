import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy") {
  return format(new Date(date), fmt);
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string) {
  return differenceInDays(new Date(checkOut), new Date(checkIn));
}

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateBookingRef() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `GCS-${random}`;
}

export function truncate(text: string, length = 100) {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Serialize Prisma objects to plain JS (converts Decimal → number, Date → string)
// Use at Server→Client component boundaries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(data: T): any {
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    if (value !== null && typeof value === "object" && typeof value.toNumber === "function") {
      return value.toNumber();
    }
    return value;
  }));
}
