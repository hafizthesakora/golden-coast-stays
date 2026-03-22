"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Feature badge component
// ---------------------------------------------------------------------------

function FeatureBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#c9a961]/30 border border-[#c9a961]/60 flex-shrink-0">
        <CheckCircle className="w-3 h-3 text-[#e8d5a3]" />
      </div>
      <span className="text-[#e8d5a3] text-sm font-medium tracking-wide">{text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setAuthError("Invalid email or password. Please try again.");
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        const role = (session?.user as { role?: string })?.role;
        if (role === "admin") router.push("/admin");
        else if (role === "owner") router.push("/owner");
        else router.push(callbackUrl && callbackUrl !== "/" && callbackUrl !== "/login" ? callbackUrl : "/dashboard");
        router.refresh();
      }
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDE — hero image panel                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/h2.jpg"
          alt="Luxury property in Accra"
          fill
          className="object-cover"
          priority
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-[#1a1a1a]/70" />

        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9a7b3c] via-[#c9a961] to-[#9a7b3c]" />

        {/* Centred content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="bg-white rounded-xl px-4 py-2 inline-block shadow-md">
              <Image
                src="/images/logo.png"
                alt="Golden Coast Stay"
                width={180}
                height={60}
                className="mx-auto h-12 w-auto"
              />
            </div>
          </div>

          {/* Decorative gold separator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#c9a961]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9a961]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#c9a961]" />
          </div>

          {/* Heading */}
          <h1
            className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Welcome Back!
          </h1>

          {/* Tagline */}
          <p className="text-[#e8d5a3]/80 text-base xl:text-lg leading-relaxed max-w-sm mb-10">
            Sign into your account to access exclusive offers and manage your
            bookings.
          </p>

          {/* Feature badges */}
          <div className="flex flex-col gap-3">
            <FeatureBadge text="Verified Properties" />
            <FeatureBadge text="24/7 Support" />
            <FeatureBadge text="Secure Booking" />
          </div>

          {/* Bottom decorative quote */}
          <div className="absolute bottom-10 left-12 right-12 text-center">
            <p className="text-[#c9a961]/60 text-xs tracking-widest uppercase">
              Luxury Short-Term Rentals · Accra, Ghana
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT SIDE — form panel                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#f8f9fa] px-6 py-12 relative">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #c9a961 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/images/logo.png"
              alt="Golden Coast Stay"
              width={150}
              height={50}
              className="object-contain"
            />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-black/8 border border-gray-100 p-8 xl:p-10">
            {/* Card header */}
            <div className="mb-8">
              <h2
                className="text-3xl font-bold text-[#1a1a1a] mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Sign In
              </h2>
              <p className="text-gray-500 text-sm">
                Welcome back to{" "}
                <span className="text-[#c9a961] font-semibold">
                  Golden Coast Stay
                </span>
              </p>
            </div>

            {/* Global error alert */}
            {authError && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Email field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#343a40] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register("email")}
                    className={`
                      w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-[#1a1a1a]
                      placeholder:text-gray-400 bg-gray-50 focus:bg-white
                      outline-none transition-all duration-200
                      ${
                        errors.email
                          ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"
                      }
                    `}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#343a40] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...register("password")}
                    className={`
                      w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-[#1a1a1a]
                      placeholder:text-gray-400 bg-gray-50 focus:bg-white
                      outline-none transition-all duration-200
                      ${
                        errors.password
                          ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20"
                      }
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c9a961] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me + Forgot password row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("remember")}
                    className="w-4 h-4 rounded border-gray-300 text-[#c9a961] accent-[#c9a961] cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-[#343a40] transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#c9a961] hover:text-[#9a7b3c] font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  w-full flex items-center justify-center gap-2
                  py-3.5 px-6 rounded-xl font-semibold text-sm text-white
                  bg-gradient-to-r from-[#c9a961] to-[#9a7b3c]
                  hover:from-[#b8974f] hover:to-[#8a6b2c]
                  active:scale-[0.98] transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                  shadow-md shadow-[#c9a961]/30
                "
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#c9a961] hover:text-[#9a7b3c] font-semibold transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[#c9a961] transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[#c9a961] transition-colors">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
