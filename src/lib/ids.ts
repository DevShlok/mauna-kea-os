/**
 * Centralised ID factory for all entity primary keys.
 * Uses crypto.randomUUID() to eliminate the birthday-problem collision risk
 * from the old Math.random()-based approach (which had only ~10,000 possible values
 * for user IDs and ~7-char random strings for candidate IDs).
 *
 * Import from here everywhere instead of inlining ID generation.
 */
import crypto from "crypto";

export const newUserId     = () => `U-${crypto.randomUUID()}`;
export const newCandId     = () => `CAND-${crypto.randomUUID()}`;
export const newFloatId    = () => `SUB-${crypto.randomUUID()}`;
export const newFollowUpId = () => `FU-${crypto.randomUUID()}`;
export const newClientId   = () => `CLI-${crypto.randomUUID()}`;
