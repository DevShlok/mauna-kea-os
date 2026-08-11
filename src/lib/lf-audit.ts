/**
 * lib/lf-audit.ts
 *
 * Immutable audit log writer for the Legal & Finance module.
 *
 * RULES:
 * - Never UPDATE or DELETE from lf_audit_logs in application code.
 * - This function only INSERTs. It never throws — audit failures are
 *   logged to console but must not break the parent operation.
 * - Call writeLfAuditLog AFTER the primary DB operation succeeds.
 *
 * Supported entity types:  'contract' | 'invoice' | 'payment' | 'client'
 * Supported actions:
 *   contract:  created | edited | downloaded | shared | approved | rejected |
 *              signed_uploaded | renewed | expired | deleted | renewal_reminder
 *   invoice:   created | edited | generated | shared | downloaded | cancelled |
 *              cn_issued | payment_recorded | payment_reversed | reminder_sent
 *   payment:   payment_recorded | payment_reversed
 *   client:    gst_updated | billing_changed | commercials_modified
 */
"use server";

import { db } from "@/db";
import { lfAuditLogs } from "@/db/schema";

export interface AuditPayload {
  entityType: "contract" | "invoice" | "payment" | "client";
  entityId: string;
  action: string;
  actorName: string;
  actorRole?: string;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changeReason?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

/**
 * Appends one immutable audit log entry.
 * Safe to call from any server action or API route.
 * Never throws — failures are caught and logged to console only.
 */
export async function writeLfAuditLog(payload: AuditPayload): Promise<void> {
  try {
    await db.insert(lfAuditLogs).values({
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      actorName: payload.actorName,
      actorRole: payload.actorRole ?? null,
      previousValue: payload.previousValue ?? null,
      newValue: payload.newValue ?? null,
      changeReason: payload.changeReason ?? null,
      ipAddress: payload.ipAddress ?? null,
      metadata: payload.metadata ?? {},
    });
  } catch (e) {
    console.error("[lf-audit] Failed to write audit log:", {
      entityType: payload.entityType,
      entityId: payload.entityId,
      action: payload.action,
      error: e,
    });
  }
}
