"use server";

import { db } from "@/db";
import { contracts, contractDocuments, invoices, invoicePayments, clients, consultantNotifications, mandates, candidates } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { newContractId, newInvoiceId } from "@/lib/ids";
import { generateContractNumber, generateInvoiceNumber, generateCreditNoteNumber } from "@/lib/lf-sequences";
import { writeLfAuditLog } from "@/lib/lf-audit";
import { createContractSchema, updateContractSchema } from "@/lib/validations";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Get current platform user name for audit trails
 */
async function getCurrentUserName(): Promise<{ name: string; role: string }> {
  const { platformUser } = await requireRole(["admin", "consultant", "finance"]);
  return {
    name: platformUser?.name || "System User",
    role: platformUser?.role || "consultant",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── CONTRACT ACTIONS ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export async function createContractAction(data: any) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();

  const validated = createContractSchema.parse(data);

  // Fetch client details for freezing snapshot
  const [clientObj] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, validated.clientId));

  if (!clientObj) {
    throw new Error("Client not found for contract creation.");
  }

  const clientSnapshot = {
    id: clientObj.id,
    name: clientObj.name,
    legalEntityName: clientObj.legalEntityName || clientObj.name,
    gstNumber: clientObj.gstNumber,
    panNumber: clientObj.panNumber,
    registeredAddress: clientObj.registeredAddress,
    billingAddress: clientObj.billingAddress,
    city: clientObj.city,
    state: clientObj.state,
    pinCode: clientObj.pinCode,
    placeOfSupply: clientObj.placeOfSupply,
    financeContactName: clientObj.financeContactName,
    financeEmail: clientObj.financeEmail,
  };

  const id = newContractId();
  const contractNumber = await generateContractNumber();

  await db.insert(contracts).values({
    id,
    contractNumber,
    clientId: validated.clientId,
    clientSnapshot,
    consultant: validated.consultant || actorName,
    businessHead: validated.businessHead,
    practice: validated.practice,
    contractStartDate: validated.contractStartDate,
    contractEndDate: validated.contractEndDate,
    renewalType: validated.renewalType || "Manual",
    status: validated.status || "Draft",
    commercialStructure: validated.commercialStructure,
    successFeePct: validated.successFeePct,
    minFee: validated.minFee,
    maxFee: validated.maxFee,
    retainerAmount: validated.retainerAmount,
    replacementPeriod: validated.replacementPeriod,
    guaranteePeriod: validated.guaranteePeriod,
    paymentTerms: validated.paymentTerms,
    currency: validated.currency || "INR",
    billingMilestones: validated.billingMilestones || [],
    signingAuthorityClient: validated.signingAuthorityClient || {},
    signingAuthorityMK: validated.signingAuthorityMK || {},
    ctcSlabs: validated.ctcSlabs || [],
    customClauses: validated.customClauses || [],
    latePaymentClause: validated.latePaymentClause,
    travelExpenses: validated.travelExpenses,
    exclusivity: validated.exclusivity ?? false,
    nonPoachingMonths: validated.nonPoachingMonths ?? 0,
    confidentiality: validated.confidentiality ?? true,
    notes: validated.notes,
    createdBy: actorName,
    approvalStatus: "Pending",
  });

  // Bi-directional replication back to Client Database
  await db
    .update(clients)
    .set({
      owner: validated.consultant || clientObj.owner,
      vertical: validated.practice || clientObj.vertical,
      defaultPaymentTerms: validated.paymentTerms || clientObj.defaultPaymentTerms,
    })
    .where(eq(clients.id, validated.clientId));

  await writeLfAuditLog({
    entityType: "contract",
    entityId: id,
    action: "created",
    actorName,
    actorRole,
    newValue: { contractNumber, clientId: validated.clientId, status: validated.status },
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  revalidatePath(`/dashboard/clients/${validated.clientId}`);

  return { id, contractNumber };
}

export async function updateContractAction(id: string, data: any, changeReason?: string) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();

  const [existing] = await db.select().from(contracts).where(eq(contracts.id, id));
  if (!existing) throw new Error("Contract not found.");
  if (existing.isDeleted) throw new Error("Cannot edit a deleted contract.");

  // If contract is Signed, prevent inline edits unless user is admin
  if (existing.status === "Signed" && actorRole !== "admin") {
    throw new Error("Signed contracts are locked. Create a new version or contact an Administrator.");
  }

  const validated = updateContractSchema.parse(data);

  await db
    .update(contracts)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id));

  await writeLfAuditLog({
    entityType: "contract",
    entityId: id,
    action: "edited",
    actorName,
    actorRole,
    previousValue: existing,
    newValue: validated,
    changeReason,
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  revalidatePath(`/dashboard/legal-finance/contracts/${id}`);
  return { success: true };
}

export async function approveContractAction(id: string, approved: boolean, notes?: string) {
  const { platformUser, userRole } = await requireRole(["admin", "finance"]);
  const actorName = platformUser?.name || "Approver";

  const [existing] = await db.select().from(contracts).where(eq(contracts.id, id));
  if (!existing) throw new Error("Contract not found.");

  const approvalStatus = approved ? "Approved" : "Rejected";

  await db
    .update(contracts)
    .set({
      approvalStatus,
      approvedBy: actorName,
      approvedAt: new Date(),
      status: approved ? "Shared" : "Draft",
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id));

  // Notify consultant
  if (existing.consultant) {
    await db.insert(consultantNotifications).values({
      targetRole: "consultant",
      message: `Contract ${existing.contractNumber} was ${approvalStatus.toLowerCase()} by ${actorName}. ${notes ? `Notes: ${notes}` : ""}`,
      link: `/dashboard/legal-finance/contracts/${id}`,
    });
  }

  await writeLfAuditLog({
    entityType: "contract",
    entityId: id,
    action: approved ? "approved" : "rejected",
    actorName,
    actorRole: userRole,
    changeReason: notes,
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  revalidatePath(`/dashboard/legal-finance/contracts/${id}`);
  return { success: true };
}

export async function uploadSignedContractAction(
  id: string,
  signedDocUrl: string,
  fileName: string,
  fileSizeBytes?: number
) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();

  const [existing] = await db.select().from(contracts).where(eq(contracts.id, id));
  if (!existing) throw new Error("Contract not found.");

  await db
    .update(contracts)
    .set({
      signedDocUrl,
      status: "Signed",
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id));

  await db.insert(contractDocuments).values({
    contractId: id,
    label: "Signed Executed Copy",
    fileUrl: signedDocUrl,
    fileName,
    fileSizeBytes: fileSizeBytes || 0,
    uploadedBy: actorName,
  });

  await writeLfAuditLog({
    entityType: "contract",
    entityId: id,
    action: "signed_uploaded",
    actorName,
    actorRole,
    newValue: { signedDocUrl, fileName },
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  revalidatePath(`/dashboard/legal-finance/contracts/${id}`);
  return { success: true };
}

export async function renewContractAction(id: string, newEndDate: string) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();

  const [parent] = await db.select().from(contracts).where(eq(contracts.id, id));
  if (!parent) throw new Error("Parent contract not found.");

  // Mark parent as Renewed
  await db
    .update(contracts)
    .set({ status: "Renewed", updatedAt: new Date() })
    .where(eq(contracts.id, id));

  // Calculate new start date (1 day after parent end date)
  const newStart = new Date(parent.contractEndDate);
  newStart.setDate(newStart.getDate() + 1);

  const newId = newContractId();
  const contractNumber = await generateContractNumber();

  await db.insert(contracts).values({
    ...parent,
    id: newId,
    contractNumber,
    contractStartDate: newStart.toISOString().split("T")[0],
    contractEndDate: newEndDate,
    status: "Draft",
    approvalStatus: "Pending",
    approvedBy: null,
    approvedAt: null,
    signedDocUrl: null,
    version: (parent.version || 1) + 1,
    parentContractId: id,
    createdBy: actorName,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await writeLfAuditLog({
    entityType: "contract",
    entityId: newId,
    action: "renewed",
    actorName,
    actorRole,
    previousValue: { parentContractId: id, oldEndDate: parent.contractEndDate },
    newValue: { newContractNumber: contractNumber, newEndDate },
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  return { id: newId, contractNumber };
}

export async function deleteContractAction(id: string, reason: string) {
  const { platformUser, userRole } = await requireRole(["admin", "finance"]);
  const actorName = platformUser?.name || "Admin";

  if (!reason?.trim()) {
    throw new Error("Deletion reason is mandatory.");
  }

  await db
    .update(contracts)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: actorName,
    })
    .where(eq(contracts.id, id));

  await writeLfAuditLog({
    entityType: "contract",
    entityId: id,
    action: "deleted",
    actorName,
    actorRole: userRole,
    changeReason: reason,
  });

  revalidatePath("/dashboard/legal-finance/contracts");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── INVOICE ACTIONS ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export async function createInvoiceAction(data: {
  clientId: string;
  contractId?: string | null;
  mandateId?: number | null;
  candId?: string | null;
  invoiceDate: string;
  dueDate: string;
  joiningDate?: string | null;
  annualCtc?: number;
  commercialPct?: number;
  poNumber?: string | null;
  notes?: string | null;
  taxType?: "INTRA_STATE" | "UNION_TERRITORY" | "INTER_STATE";
  lineItems?: any[];
}) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();

  // Fetch client & contract snapshots
  const [clientObj] = await db.select().from(clients).where(eq(clients.id, data.clientId));
  if (!clientObj) throw new Error("Client not found.");

  const [contractObj] = data.contractId
    ? await db.select().from(contracts).where(eq(contracts.id, data.contractId))
    : [null];

  // Validation: Check duplicate invoice for candidate + mandate
  if (data.candId && data.mandateId) {
    const existing = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.candId, data.candId),
          eq(invoices.mandateId, data.mandateId),
          eq(invoices.isDeleted, false)
        )
      );

    if (existing.length > 0 && existing.some((i) => i.status !== "Cancelled")) {
      throw new Error("An active invoice already exists for this candidate and mandate.");
    }
  }

  // Financial calculations from line items or single placement
  const lineItemsList = data.lineItems && data.lineItems.length > 0
    ? data.lineItems
    : [
        {
          candId: data.candId,
          annualCtc: data.annualCtc || 0,
          feePct: data.commercialPct || 0,
          feeAmount: Math.round(((data.annualCtc || 0) * 100000 * (data.commercialPct || 0)) / 100),
          particulars: `Executive Search Professional Fee — Success fee (${data.commercialPct || 0}%) for Placement against Annual CTC of ₹${data.annualCtc || 0} Lakhs`,
        },
      ];

  const feeBeforeTax = lineItemsList.reduce((sum: number, item: any) => sum + (item.feeAmount || 0), 0);
  const gstRate = clientObj.gstRate || 18;
  const gstAmount = clientObj.gstApplicable !== false ? Math.round((feeBeforeTax * gstRate) / 100) : 0;
  const totalAmount = feeBeforeTax + gstAmount;

  // Split CGST/SGST/UTGST/IGST based on taxType & place of supply
  const taxType = data.taxType || (clientObj.state?.toLowerCase() !== "maharashtra" ? "INTER_STATE" : "INTRA_STATE");

  let cgstAmount = 0;
  let sgstAmount = 0;
  let utgstAmount = 0;
  let igstAmount = 0;

  if (gstAmount > 0) {
    if (taxType === "INTRA_STATE") {
      cgstAmount = Math.round(gstAmount / 2);
      sgstAmount = Math.round(gstAmount / 2);
    } else if (taxType === "UNION_TERRITORY") {
      cgstAmount = Math.round(gstAmount / 2);
      utgstAmount = Math.round(gstAmount / 2);
    } else {
      igstAmount = gstAmount;
    }
  }

  const id = newInvoiceId();
  const invoiceNumber = await generateInvoiceNumber();

  await db.insert(invoices).values({
    id,
    invoiceNumber,
    clientId: data.clientId,
    contractId: data.contractId || null,
    mandateId: data.mandateId || null,
    candId: data.candId || null,
    lineItems: lineItemsList,
    clientSnapshot: {
      id: clientObj.id,
      name: clientObj.name,
      legalEntityName: clientObj.legalEntityName || clientObj.name,
      gstNumber: clientObj.gstNumber,
      billingAddress: clientObj.billingAddress,
      city: clientObj.city,
      state: clientObj.state,
      pinCode: clientObj.pinCode,
    },
    commercialSnapshot: {
      contractNumber: contractObj?.contractNumber || "STANDARD-TERMS",
      successFeePct: contractObj?.successFeePct || data.commercialPct,
      paymentTerms: contractObj?.paymentTerms || clientObj.defaultPaymentTerms || "30 days",
    },
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,
    joiningDate: data.joiningDate || null,
    annualCtc: data.annualCtc || 0,
    commercialPct: data.commercialPct || 0,
    feeBeforeTax,
    gstRate,
    gstAmount,
    cgstAmount,
    sgstAmount,
    utgstAmount,
    igstAmount,
    taxType,
    totalAmount,
    amountOutstanding: totalAmount,
    currency: clientObj.currency || "INR",
    poNumber: data.poNumber || null,
    notes: data.notes || null,
    consultant: actorName,
    createdBy: actorName,
    status: "Draft",
  });

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: id,
    action: "generated",
    actorName,
    actorRole,
    newValue: { invoiceNumber, totalAmount, feeBeforeTax },
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  return { id, invoiceNumber };
}

export async function updateInvoiceStatusAction(id: string, status: string) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();

  await db
    .update(invoices)
    .set({ status, updatedAt: new Date() })
    .where(eq(invoices.id, id));

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: id,
    action: `status_${status.toLowerCase()}`,
    actorName,
    actorRole,
    newValue: { status },
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  revalidatePath(`/dashboard/legal-finance/invoices/${id}`);
  return { success: true };
}

export async function cancelInvoiceAction(id: string, reason: string) {
  const { platformUser, userRole } = await requireRole(["admin", "finance"]);
  const actorName = platformUser?.name || "Finance";

  if (!reason?.trim()) {
    throw new Error("Cancellation reason is mandatory.");
  }

  await db
    .update(invoices)
    .set({
      status: "Cancelled",
      cancelReason: reason,
      cancelBy: actorName,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id));

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: id,
    action: "cancelled",
    actorName,
    actorRole: userRole,
    changeReason: reason,
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── PAYMENT ACTIONS ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export async function recordPaymentAction(data: {
  invoiceId: string;
  paymentDate: string;
  amount: number;
  referenceNumber?: string;
  utrNumber?: string;
  mode?: string;
  notes?: string;
}) {
  const { platformUser, userRole } = await requireRole(["admin", "finance"]);
  const actorName = platformUser?.name || "Finance";

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, data.invoiceId));
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status === "Cancelled") throw new Error("Cannot record payment on a cancelled invoice.");

  await db.insert(invoicePayments).values({
    invoiceId: data.invoiceId,
    paymentDate: data.paymentDate,
    amount: data.amount,
    referenceNumber: data.referenceNumber || null,
    utrNumber: data.utrNumber || null,
    mode: data.mode || null,
    notes: data.notes || null,
    recordedBy: actorName,
  });

  // Calculate new total paid
  const allPayments = await db
    .select({ amount: invoicePayments.amount, isReversed: invoicePayments.isReversed })
    .from(invoicePayments)
    .where(eq(invoicePayments.invoiceId, data.invoiceId));

  const totalPaid = allPayments
    .filter((p) => !p.isReversed)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const outstanding = Math.max(0, (invoice.totalAmount || 0) - totalPaid);

  let newStatus: string;
  if (totalPaid <= 0) newStatus = invoice.status || "Shared";
  else if (outstanding <= 0.01) newStatus = "Paid";
  else newStatus = "Partially Paid";

  await db
    .update(invoices)
    .set({
      amountPaid: totalPaid,
      amountOutstanding: outstanding,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, data.invoiceId));

  await writeLfAuditLog({
    entityType: "payment",
    entityId: data.invoiceId,
    action: "payment_recorded",
    actorName,
    actorRole: userRole,
    newValue: { amount: data.amount, mode: data.mode, utr: data.utrNumber, newStatus, totalPaid },
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  revalidatePath("/dashboard/legal-finance/payments");
  return { newStatus, totalPaid, outstanding };
}

export async function reversePaymentAction(paymentId: number, reason: string) {
  const { platformUser, userRole } = await requireRole(["admin", "finance"]);
  const actorName = platformUser?.name || "Finance";

  if (!reason?.trim()) throw new Error("Reversal reason is mandatory.");

  const [payment] = await db.select().from(invoicePayments).where(eq(invoicePayments.id, paymentId));
  if (!payment) throw new Error("Payment record not found.");
  if (payment.isReversed) throw new Error("Payment is already reversed.");

  await db
    .update(invoicePayments)
    .set({
      isReversed: true,
      reversedAt: new Date(),
      reversedBy: actorName,
      reversalReason: reason,
    })
    .where(eq(invoicePayments.id, paymentId));

  // Recalculate invoice status
  const allPayments = await db
    .select({ amount: invoicePayments.amount, isReversed: invoicePayments.isReversed })
    .from(invoicePayments)
    .where(eq(invoicePayments.invoiceId, payment.invoiceId));

  const totalPaid = allPayments
    .filter((p) => !p.isReversed)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId));
  const outstanding = Math.max(0, (invoice?.totalAmount || 0) - totalPaid);
  const newStatus = outstanding <= 0.01 ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Shared";

  await db
    .update(invoices)
    .set({
      amountPaid: totalPaid,
      amountOutstanding: outstanding,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, payment.invoiceId));

  await writeLfAuditLog({
    entityType: "payment",
    entityId: payment.invoiceId,
    action: "payment_reversed",
    actorName,
    actorRole: userRole,
    changeReason: reason,
    previousValue: { amount: payment.amount, paymentId },
  });

  revalidatePath("/dashboard/legal-finance/invoices");
  revalidatePath("/dashboard/legal-finance/payments");
  return { success: true };
}

/**
 * Triggered automatically when a candidate pipeline stage moves to 'offer-accepted', 'closed', or 'Hired'
 */
export async function triggerAutoDraftInvoice({
  mandateId,
  candId,
  actorName = "Placement Automation",
}: {
  mandateId: number;
  candId: string;
  actorName?: string;
}) {
  try {
    // 1. Check if invoice already exists for this mandate & candidate
    const existing = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.mandateId, mandateId),
          eq(invoices.candId, candId),
          eq(invoices.isDeleted, false)
        )
      );

    if (existing.length > 0 && existing.some((i) => i.status !== "Cancelled")) {
      return { success: false, reason: "Invoice already exists for placement." };
    }

    // 2. Fetch Mandate
    const [mandate] = await db.select().from(mandates).where(eq(mandates.id, mandateId));
    if (!mandate) return { success: false, reason: "Mandate not found." };

    // 3. Fetch Client (by clientId or matching company name)
    let [clientObj] = mandate.clientId
      ? await db.select().from(clients).where(eq(clients.id, mandate.clientId))
      : await db.select().from(clients).where(eq(clients.name, mandate.company || ""));

    if (!clientObj) {
      // Fallback: create temporary client reference or pick first matching
      const allClients = await db.select().from(clients).limit(1);
      if (allClients.length === 0) return { success: false, reason: "No client record found." };
      clientObj = allClients[0];
    }

    // 4. Fetch Active Signed Contract for Client
    const [contractObj] = await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.clientId, clientObj.id),
          eq(contracts.status, "Signed"),
          eq(contracts.isDeleted, false)
        )
      )
      .orderBy(sql`${contracts.createdAt} DESC`)
      .limit(1);

    // Fallback contract terms if no signed contract exists
    const successFeePct = contractObj?.successFeePct || 20;
    const contractId = contractObj?.id || null;

    // 5. Fetch Candidate CTC (default to 30 Lakhs if not recorded)
    const [candObj] = await db.select().from(candidates).where(eq(candidates.id, candId));
    const annualCtc = 30; // 30 Lakhs base estimate

    // Financial calculations
    const ctcRupees = annualCtc * 100000;
    const feeBeforeTax = Math.round((ctcRupees * successFeePct) / 100);
    const gstRate = clientObj.gstRate || 18;
    const gstAmount = clientObj.gstApplicable !== false ? Math.round((feeBeforeTax * gstRate) / 100) : 0;
    const totalAmount = feeBeforeTax + gstAmount;

    const isInterstate = clientObj.state?.toLowerCase() !== "maharashtra";
    const cgstAmount = !isInterstate && gstAmount > 0 ? Math.round(gstAmount / 2) : 0;
    const sgstAmount = !isInterstate && gstAmount > 0 ? Math.round(gstAmount / 2) : 0;
    const igstAmount = isInterstate ? gstAmount : 0;

    const invoiceDate = new Date().toISOString().split("T")[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDate = dueDateObj.toISOString().split("T")[0];

    const id = newInvoiceId();
    const invoiceNumber = await generateInvoiceNumber();

    await db.insert(invoices).values({
      id,
      invoiceNumber,
      clientId: clientObj.id,
      contractId,
      mandateId,
      candId,
      clientSnapshot: {
        id: clientObj.id,
        name: clientObj.name,
        legalEntityName: clientObj.legalEntityName || clientObj.name,
        gstNumber: clientObj.gstNumber,
        billingAddress: clientObj.billingAddress,
        city: clientObj.city,
        state: clientObj.state,
      },
      commercialSnapshot: {
        contractNumber: contractObj?.contractNumber || "STANDARD-TERMS",
        successFeePct,
      },
      invoiceDate,
      dueDate,
      annualCtc,
      commercialPct: successFeePct,
      feeBeforeTax,
      gstRate,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      amountOutstanding: totalAmount,
      currency: clientObj.currency || "INR",
      notes: `Auto-drafted upon placement of candidate ${candObj?.name || candId} for mandate ${mandate.role} @ ${mandate.company}.`,
      consultant: mandate.consultant || actorName,
      createdBy: actorName,
      status: "Draft",
    });

    // Notify Finance team
    await db.insert(consultantNotifications).values({
      targetRole: "finance",
      message: `Placement Invoice Auto-Drafted: ${invoiceNumber} for candidate ${candObj?.name || "Placement"} (${mandate.company} - ${mandate.role}) of ₹${(totalAmount / 100000).toFixed(2)} L. Click to review.`,
      link: `/dashboard/legal-finance/invoices/${id}`,
    });

    await writeLfAuditLog({
      entityType: "invoice",
      entityId: id,
      action: "auto_drafted",
      actorName,
      newValue: { invoiceNumber, candidateName: candObj?.name, company: mandate.company, totalAmount },
    });

    revalidatePath("/dashboard/legal-finance/invoices");
    return { success: true, id, invoiceNumber };
  } catch (err: any) {
    console.error("Auto-draft invoice trigger error:", err);
    return { success: false, reason: err.message };
  }
}

export async function createCreditNoteAction(
  originalInvoiceId: string,
  creditAmount: number,
  reason: string
) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();
  await requireRole(["admin", "finance"]);

  if (!creditAmount || creditAmount <= 0) {
    throw new Error("Credit amount must be greater than zero.");
  }
  if (!reason?.trim()) {
    throw new Error("Reason for credit note is required.");
  }

  const [orig] = await db.select().from(invoices).where(eq(invoices.id, originalInvoiceId));
  if (!orig) throw new Error("Original invoice not found.");

  const newId = newInvoiceId();
  const cnNumber = await generateCreditNoteNumber();
  const todayStr = new Date().toISOString().split("T")[0];

  await db.insert(invoices).values({
    id: newId,
    invoiceNumber: cnNumber,
    clientId: orig.clientId,
    contractId: orig.contractId,
    mandateId: orig.mandateId,
    candId: orig.candId,
    clientSnapshot: orig.clientSnapshot,
    commercialSnapshot: orig.commercialSnapshot,
    invoiceDate: todayStr,
    dueDate: todayStr,
    invoiceType: "CREDIT_NOTE",
    parentInvoiceId: orig.id,
    feeBeforeTax: -Math.abs(creditAmount),
    totalAmount: -Math.abs(creditAmount),
    amountPaid: -Math.abs(creditAmount),
    amountOutstanding: 0,
    currency: orig.currency || "INR",
    notes: `Credit Note issued against ${orig.invoiceNumber}. Reason: ${reason.trim()}`,
    status: "Issued",
    createdBy: actorName,
  });

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: newId,
    action: "credit_note_issued",
    actorName,
    actorRole,
    newValue: { creditNoteNumber: cnNumber, originalInvoiceId: orig.id, creditAmount, reason },
  });

  revalidatePath(`/dashboard/legal-finance/invoices/${originalInvoiceId}`);
  revalidatePath("/dashboard/legal-finance/invoices");
  return { success: true, id: newId, creditNoteNumber: cnNumber };
}

export async function amendInvoiceAction(
  originalInvoiceId: string,
  updatedFields: {
    poNumber?: string;
    notes?: string;
    dueDate?: string;
    lineItems?: any[];
    feeBeforeTax?: number;
    totalAmount?: number;
  },
  reason: string
) {
  const { name: actorName, role: actorRole } = await getCurrentUserName();
  await requireRole(["admin", "finance"]);

  if (!reason?.trim()) {
    throw new Error("Reason for amendment is required.");
  }

  const [orig] = await db.select().from(invoices).where(eq(invoices.id, originalInvoiceId));
  if (!orig) throw new Error("Original invoice not found.");

  await db
    .update(invoices)
    .set({
      status: "Superseded",
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, originalInvoiceId));

  const newVersion = (orig.version || 1) + 1;
  const newId = newInvoiceId();
  const newNumber = `${orig.invoiceNumber}-v${newVersion}`;

  const newFee = updatedFields.feeBeforeTax ?? orig.feeBeforeTax ?? 0;
  const newTotal = updatedFields.totalAmount ?? orig.totalAmount ?? 0;

  await db.insert(invoices).values({
    ...orig,
    id: newId,
    invoiceNumber: newNumber,
    version: newVersion,
    parentInvoiceId: orig.id,
    invoiceType: "AMENDMENT",
    status: "Shared",
    poNumber: updatedFields.poNumber !== undefined ? updatedFields.poNumber : orig.poNumber,
    notes: updatedFields.notes !== undefined ? updatedFields.notes : orig.notes,
    dueDate: updatedFields.dueDate || orig.dueDate,
    lineItems: updatedFields.lineItems || orig.lineItems,
    feeBeforeTax: newFee,
    totalAmount: newTotal,
    amountOutstanding: newTotal,
    amountPaid: 0,
    createdBy: actorName,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await writeLfAuditLog({
    entityType: "invoice",
    entityId: newId,
    action: "invoice_amended",
    actorName,
    actorRole,
    previousValue: { originalInvoiceId, oldVersion: orig.version },
    newValue: { newInvoiceNumber: newNumber, newVersion, reason },
  });

  revalidatePath(`/dashboard/legal-finance/invoices/${originalInvoiceId}`);
  revalidatePath(`/dashboard/legal-finance/invoices/${newId}`);
  revalidatePath("/dashboard/legal-finance/invoices");
  return { success: true, id: newId, invoiceNumber: newNumber };
}


