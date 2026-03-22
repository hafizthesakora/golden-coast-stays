"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .toLowerCase(),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[\d\s\-()]{7,20}$/.test(val),
        "Please enter a valid phone number"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    terms: z
      .string()
      .or(z.boolean())
      .refine((val) => val === "on" || val === true || val === "true", {
        message: "You must accept the terms and conditions",
      }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

type RegisterResult = ActionResult & {
  userId?: string;
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Register a new user.
 */
export async function registerUser(formData: FormData): Promise<RegisterResult> {
  try {
    const rawData = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || undefined,
      password: formData.get("password") as string,
      confirm_password: formData.get("confirm_password") as string,
      terms: formData.get("terms") as string,
    };

    // Strip empty phone so optional works correctly
    if (!rawData.phone) {
      delete rawData.phone;
    }

    const parsed = registerSchema.safeParse(rawData);

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      });
      return {
        success: false,
        message: "Please fix the errors below.",
        errors,
      };
    }

    const { full_name, email, phone, password } = parsed.data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        message: "An account with this email address already exists.",
        errors: {
          email: ["An account with this email address already exists."],
        },
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: full_name,
        email,
        phone: phone ?? null,
        password: hashedPassword,
      },
      select: { id: true },
    });

    return {
      success: true,
      message: "Your account has been created successfully! Welcome to Golden Coast Stay.",
      userId: user.id,
    };
  } catch (error) {
    console.error("[registerUser] Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}

/**
 * Initiate the forgot-password flow.
 * Returns the same message regardless of whether the email was found,
 * to prevent user enumeration.
 */
export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const GENERIC_MESSAGE =
    "If an account with that email exists, you will receive a password reset link shortly.";

  try {
    const rawData = {
      email: formData.get("email") as string,
    };

    const parsed = forgotPasswordSchema.safeParse(rawData);

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      });
      return {
        success: false,
        message: "Please enter a valid email address.",
        errors,
      };
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Always return the same message whether user found or not
    if (!user) {
      return { success: true, message: GENERIC_MESSAGE };
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token and expiry on user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiresAt,
      },
    });

    // In a real application you would send an email here with the rawToken.
    // e.g.: await sendPasswordResetEmail(user.email, user.name, rawToken);
    console.info(
      `[forgotPassword] Reset token generated for ${email}. Token (dev only): ${rawToken}`
    );

    return { success: true, message: GENERIC_MESSAGE };
  } catch (error) {
    console.error("[forgotPassword] Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}
