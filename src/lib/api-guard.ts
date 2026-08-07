/**
 * Central API security helpers — input validation and file upload guards.
 *
 * Import these in every API route to enforce consistent, schema-validated
 * inputs and strict file type / size limits.
 */

import { NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

// ─── Allowed MIME types ───────────────────────────────────────────────────────

export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const ALLOWED_PDF_ONLY = new Set(["application/pdf"]);

// ─── File size limits ─────────────────────────────────────────────────────────

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;     // 5 MB

// ─── Allowed file proxy hostnames (view-file SSRF protection) ─────────────────
// Only these hosts can be fetched via /api/view-file.
// Add new domains here when you add new storage integrations.
export const ALLOWED_PROXY_HOSTS = new Set([
  // Supabase Storage (replace 'vzsvuakvrnqodozyjpfr' with your actual project ref)
  "vzsvuakvrnqodozyjpfr.supabase.co",
  // Google Drive / Docs
  "drive.google.com",
  "docs.google.com",
  // Google User Content (Drive thumbnails / download)
  "lh3.googleusercontent.com",
  "drive.usercontent.google.com",
]);

// ─── Body validation ─────────────────────────────────────────────────────────

/**
 * Validates a plain object against a Zod schema.
 * Returns `{ data }` on success or `{ error: NextResponse }` on failure.
 * The caller must return the error response immediately.
 *
 * @example
 *   const parsed = validateBody(mySchema, await req.json());
 *   if ("error" in parsed) return parsed.error;
 *   const { field } = parsed.data;
 */
export function validateBody<T extends ZodSchema>(
  schema: T,
  input: unknown
): { data: z.infer<T> } | { error: NextResponse } {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      error: NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}

// ─── File upload validation ───────────────────────────────────────────────────

interface FileUploadOptions {
  /** Set of allowed MIME types */
  allowedTypes: Set<string>;
  /** Maximum file size in bytes */
  maxBytes: number;
}

/**
 * Validates that an uploaded file has an allowed MIME type and is within the
 * size limit. Returns `{ ok: true }` or `{ ok: false, error: NextResponse }`.
 *
 * @example
 *   const check = validateFileUpload(file, { allowedTypes: ALLOWED_DOCUMENT_TYPES, maxBytes: MAX_DOCUMENT_SIZE_BYTES });
 *   if (!check.ok) return check.error;
 */
export function validateFileUpload(
  file: File,
  { allowedTypes, maxBytes }: FileUploadOptions
): { ok: true } | { ok: false; error: NextResponse } {
  // Check MIME type
  if (!allowedTypes.has(file.type)) {
    const allowed = Array.from(allowedTypes).join(", ");
    return {
      ok: false,
      error: NextResponse.json(
        {
          error: `Unsupported file type: "${file.type}". Allowed: ${allowed}`,
        },
        { status: 400 }
      ),
    };
  }

  // Check file size
  if (file.size > maxBytes) {
    const maxMB = (maxBytes / 1024 / 1024).toFixed(0);
    return {
      ok: false,
      error: NextResponse.json(
        { error: `File too large. Maximum allowed size is ${maxMB} MB.` },
        { status: 413 }
      ),
    };
  }

  return { ok: true };
}

// ─── URL proxy allowlist ──────────────────────────────────────────────────────

/**
 * Returns true if the given URL's hostname is in the SSRF allowlist.
 * This prevents /api/view-file from being used to proxy requests to
 * arbitrary internal or external URLs.
 */
export function isAllowedProxyUrl(rawUrl: string): boolean {
  try {
    const { protocol, hostname } = new URL(rawUrl);
    if (protocol !== "https:") return false;
    // Allow exact match or subdomain match (e.g. xxx.supabase.co)
    for (const allowed of Array.from(ALLOWED_PROXY_HOSTS)) {
      if (hostname === allowed || hostname.endsWith("." + allowed)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Supabase admin client (server-side only) ─────────────────────────────────

/**
 * Creates a Supabase admin client using the SERVICE_ROLE_KEY.
 * Throws a clear error if the key is missing rather than silently falling
 * back to the public anon key (which would bypass RLS).
 *
 * Only import this in Server Components, Server Actions, or API Routes —
 * never in client-side code.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Add it to your environment variables."
    );
  }
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "This key is required for server-side file uploads. " +
      "Never use the public NEXT_PUBLIC_* key for server operations."
    );
  }

  // Lazy import to keep this server-only
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, serviceKey) as ReturnType<typeof createClient>;
}
