"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Menu, X, ChevronDown, User, Heart, Calendar, LogOut,
  Settings, Phone, MapPin, Globe, Home, Building2, LayoutDashboard,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Nav for guests who are NOT logged in
const PUBLIC_NAV = [
  { href: "/",                    key: "nav_home" },
  { href: "/stays",               key: "nav_stays" },
  { href: "/service-apartments",  key: "nav_apts" },
  { href: "/virtual-tours",       key: "nav_tours" },
  { href: "/about",               key: "nav_about" },
  { href: "/contact",             key: "nav_contact" },
];

// Nav for logged-in guests (role = "user")
const GUEST_NAV = [
  { href: "/stays",         key: "nav_stays" },
  { href: "/virtual-tours", key: "nav_tours" },
];

// Nav for owners browsing the public site
const OWNER_PUBLIC_NAV = [
  { href: "/stays",         key: "nav_stays" },
  { href: "/virtual-tours", key: "nav_tours" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen]         = useState(false);
  const pathname                        = usePathname();
  const { data: session, status }       = useSession();
  const { lang, setLang, langs, t }     = useI18n();
  const userMenuRef                     = useRef<HTMLDivElement>(null);
  const langMenuRef                     = useRef<HTMLDivElement>(null);

  const role      = (session?.user as { role?: string })?.role ?? "user";
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated";
  const isHome    = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Pick which nav links to show
  const navLinks = !isLoggedIn
    ? PUBLIC_NAV
    : role === "owner" || role === "admin"
      ? OWNER_PUBLIC_NAV
      : GUEST_NAV;

  const navBg = isScrolled || !isHome || mobileOpen
    ? "bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
    : "bg-transparent";

  const linkColor = isScrolled || !isHome
    ? "text-[#343a40] hover:text-[#c9a961]"
    : "text-white hover:text-[#e8d5a3]";

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-400", navBg)}>
      {/* Top bar — public / home only */}
      {!isScrolled && isHome && !mobileOpen && !isLoggedIn && (
        <div className="hidden xl:block border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-12 py-2 flex justify-between items-center text-xs text-white/70">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Accra, Ghana</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> +233 50 869 7753</span>
            </div>
            <span>Premium Short-Term Rentals &amp; Tours in Ghana</span>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-20 lg:h-28">

          {/* Logo */}
          <Link href={isLoggedIn && role === "admin" ? "/admin" : isLoggedIn && role === "owner" ? "/owner" : "/"} className="flex items-center flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Golden Coast Stay"
              width={170} height={54}
              className={cn("h-11 w-auto transition-all duration-300", !isScrolled && isHome && !mobileOpen ? "brightness-0 invert" : "")}
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-5 py-3 text-[15px] font-medium tracking-wide transition-all duration-200 rounded-full",
                  linkColor,
                  pathname === link.href && "font-semibold"
                )}
              >
                {t(link.key)}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#c9a961]" />
                )}
              </Link>
            ))}

            {/* My Dashboard — direct link for logged-in guests */}
            {isLoggedIn && role === "user" && (
              <Link
                href="/dashboard"
                className={cn(
                  "relative px-5 py-3 text-[15px] font-medium tracking-wide transition-all duration-200 rounded-full flex items-center gap-1.5",
                  linkColor,
                  pathname.startsWith("/dashboard") && "font-semibold"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                My Dashboard
                {pathname.startsWith("/dashboard") && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#c9a961]" />
                )}
              </Link>
            )}

            {/* Owner Portal link */}
            {isLoggedIn && role === "owner" && (
              <Link
                href="/owner"
                className={cn(
                  "relative px-5 py-3 text-[15px] font-medium tracking-wide transition-all duration-200 rounded-full flex items-center gap-1.5",
                  linkColor,
                  pathname.startsWith("/owner") && "font-semibold"
                )}
              >
                <Building2 className="h-4 w-4" /> Owner Portal
              </Link>
            )}

            {/* Admin Panel link */}
            {isLoggedIn && role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "relative px-5 py-3 text-[15px] font-medium tracking-wide transition-all duration-200 rounded-full flex items-center gap-1.5",
                  linkColor,
                  pathname.startsWith("/admin") && "font-semibold"
                )}
              >
                <Settings className="h-4 w-4" /> Admin Panel
              </Link>
            )}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden xl:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all",
                  isScrolled || !isHome ? "text-[#343a40] hover:bg-[#f8f9fa]" : "text-white hover:bg-white/10"
                )}
              >
                <Globe className="h-4 w-4" />
                <span>{langs.find(l => l.code === lang)?.flag}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", langOpen && "rotate-180")} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-[#e9ecef] py-1 z-50">
                  {langs.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                        lang === l.code ? "bg-[#c9a961]/10 text-[#c9a961] font-semibold" : "text-[#343a40] hover:bg-[#f8f9fa]"
                      )}
                    >
                      <span className="text-base">{l.flag}</span>
                      {l.name}
                      {lang === l.code && <span className="ml-auto text-[#c9a961]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loading skeleton — prevent flash */}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 rounded-full bg-white/20 animate-pulse" />
                <div className="h-9 w-9 rounded-full bg-white/20 animate-pulse" />
              </div>
            )}

            {/* Logged IN */}
            {!isLoading && isLoggedIn && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                    isScrolled || !isHome ? "text-[#343a40] hover:bg-[#f8f9fa]" : "text-white hover:bg-white/10"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a961] to-[#9a7b3c] flex items-center justify-center text-white text-xs font-bold">
                    {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="max-w-24 truncate">{session?.user?.name?.split(" ")[0]}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#e9ecef] py-2 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#e9ecef]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#1a1a1a] text-sm">{session?.user?.name}</p>
                          <p className="text-[#6c757d] text-xs truncate">{session?.user?.email}</p>
                        </div>
                        {role === "admin" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Admin</span>
                        )}
                        {role === "owner" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#c9a961]/15 text-[#9a7b3c]">Owner</span>
                        )}
                        {role === "user" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Guest</span>
                        )}
                      </div>
                    </div>

                    {/* Role-specific links */}
                    {role === "admin" && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors">
                        <Settings className="h-4 w-4 text-[#c9a961]" /> Admin Panel
                      </Link>
                    )}
                    {role === "owner" && (
                      <>
                        <Link href="/owner" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors">
                          <Building2 className="h-4 w-4 text-[#c9a961]" /> Owner Portal
                        </Link>
                        <Link href="/owner/submit" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors">
                          <Home className="h-4 w-4 text-[#c9a961]" /> List a Property
                        </Link>
                      </>
                    )}
                    {role === "user" && (
                      <>
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors">
                          <LayoutDashboard className="h-4 w-4 text-[#c9a961]" /> My Dashboard
                        </Link>
                        <Link href="/dashboard?tab=bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors">
                          <Calendar className="h-4 w-4 text-[#c9a961]" /> My Bookings
                        </Link>
                        <Link href="/dashboard?tab=saved" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors">
                          <Heart className="h-4 w-4 text-[#c9a961]" /> Saved Stays
                        </Link>
                        <Link href="/dashboard?tab=account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#343a40] hover:bg-[#f8f9fa] transition-colors">
                          <User className="h-4 w-4 text-[#c9a961]" /> My Account
                        </Link>
                      </>
                    )}

                    <div className="border-t border-[#e9ecef] mt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logged OUT */}
            {!isLoading && !isLoggedIn && (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="md"
                    className={cn("font-medium", !isScrolled && isHome ? "text-white hover:bg-white/10 hover:text-white" : "text-[#343a40]")}
                  >
                    {t("nav_signin")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="gold" size="md">{t("nav_started")}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "xl:hidden p-2 rounded-xl transition-colors",
              isScrolled || !isHome || mobileOpen ? "text-[#1a1a1a] hover:bg-[#f8f9fa]" : "text-white hover:bg-white/10"
            )}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "xl:hidden overflow-hidden transition-all duration-300 bg-white border-t border-[#e9ecef]",
        mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="max-w-[1400px] mx-auto px-8 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname === link.href ? "bg-[#c9a961]/10 text-[#c9a961] font-semibold" : "text-[#343a40] hover:bg-[#f8f9fa]"
              )}
            >
              {t(link.key)}
            </Link>
          ))}

          {isLoggedIn && role === "user" && (
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              pathname.startsWith("/dashboard") ? "bg-[#c9a961]/10 text-[#c9a961] font-semibold" : "text-[#343a40] hover:bg-[#f8f9fa]"
            )}>
              <LayoutDashboard className="h-4 w-4" /> My Dashboard
            </Link>
          )}

          <div className="pt-3 border-t border-[#e9ecef] flex flex-col gap-2">
            {isLoading && (
              <div className="h-10 rounded-xl bg-[#f0f0f0] animate-pulse" />
            )}
            {!isLoading && isLoggedIn && (
              <>
                {role === "owner" && (
                  <Link href="/owner">
                    <Button variant="gold-outline" size="md" className="w-full">Owner Portal</Button>
                  </Link>
                )}
                {role === "admin" && (
                  <Link href="/admin">
                    <Button variant="gold-outline" size="md" className="w-full">Admin Panel</Button>
                  </Link>
                )}
                <Button variant="ghost" size="md" className="w-full text-red-500" onClick={() => signOut({ callbackUrl: "/" })}>
                  Sign Out
                </Button>
              </>
            )}
            {!isLoading && !isLoggedIn && (
              <>
                <Link href="/login">
                  <Button variant="dark-outline" size="md" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="gold" size="md" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
