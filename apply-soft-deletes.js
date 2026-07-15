const fs = require('fs');
let code = fs.readFileSync('src/actions/index.ts', 'utf8');

// Add getDeletedBy helper and imports
if (!code.includes('getDeletedBy')) {
  code = code.replace(
    'import { revalidatePath } from "next/cache";',
    `import { revalidatePath } from "next/cache";\nimport { createClient } from "@/utils/supabase/server";\n\nasync function getDeletedBy(): Promise<string> {\n  try {\n    const supabase = await createClient();\n    const { data: { user } } = await supabase.auth.getUser();\n    if (user?.email) {\n      const dbUser = await db.select().from(platformUsers).where(eq(platformUsers.email, user.email));\n      if (dbUser.length > 0) return dbUser[0].name;\n      return user.email;\n    }\n  } catch(e) {}\n  return "Unknown";\n}`
  );
}

// 1. deletePlatformUserAction
code = code.replace(
  `export async function deletePlatformUserAction(id: string) {
  revalidatePath("/dashboard", "layout");
  await db.delete(platformUsers).where(eq(platformUsers.id, id));
  revalidatePath("/dashboard/admin/users");
}`,
  `export async function deletePlatformUserAction(id: string) {
  revalidatePath("/dashboard", "layout");
  const deletedBy = await getDeletedBy();
  await db.update(platformUsers).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(platformUsers.id, id));
  revalidatePath("/dashboard/admin/users");
}`
);

// 2. deleteFrameworkAction
code = code.replace(
  `export async function deleteFrameworkAction(id: string) {
  revalidatePath('/dashboard', 'layout');
  
  // Need to cascade delete
  const oldCats = await db.select().from(frameworkCategories).where(eq(frameworkCategories.frameworkId, id));
  for (const cat of oldCats) {
    await db.delete(frameworkCriteria).where(eq(frameworkCriteria.categoryId, cat.id));
  }
  await db.delete(frameworkCategories).where(eq(frameworkCategories.frameworkId, id));
  await db.delete(candidateReports).where(eq(candidateReports.frameworkId, id));
  await db.update(mandates).set({ frameworkId: null }).where(eq(mandates.frameworkId, id));
  await db.delete(frameworks).where(eq(frameworks.id, id));
  revalidatePath('/dashboard/frameworks');
}`,
  `export async function deleteFrameworkAction(id: string) {
  revalidatePath('/dashboard', 'layout');
  const deletedBy = await getDeletedBy();
  await db.update(frameworks).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(frameworks.id, id));
  revalidatePath('/dashboard/frameworks');
}`
);

// 3. deleteMandateAction
code = code.replace(
  `export async function deleteMandateAction(id: number) {
  await db.delete(mandateCandidates).where(eq(mandateCandidates.mandateId, id));
  await db.delete(mandates).where(eq(mandates.id, id));
  revalidatePath("/dashboard/mandates");
}`,
  `export async function deleteMandateAction(id: number) {
  const deletedBy = await getDeletedBy();
  await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(mandates.id, id));
  revalidatePath("/dashboard/mandates");
}`
);

// 4. deleteMultipleMandatesAction
code = code.replace(
  `export async function deleteMultipleMandatesAction(ids: number[]) {
  if (!ids || ids.length === 0) return;
  await db.delete(mandateCandidates).where(inArray(mandateCandidates.mandateId, ids));
  await db.delete(mandates).where(inArray(mandates.id, ids));
  revalidatePath("/dashboard/mandates");
}`,
  `export async function deleteMultipleMandatesAction(ids: number[]) {
  if (!ids || ids.length === 0) return;
  const deletedBy = await getDeletedBy();
  await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(mandates.id, ids));
  revalidatePath("/dashboard/mandates");
}`
);

// 5. deleteClientAction
code = code.replace(
  `export async function deleteClientAction(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
  return true;
}`,
  `export async function deleteClientAction(id: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  const deletedBy = await getDeletedBy();
  if (client) {
    await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(mandates.company, client.name));
  }
  await db.update(clients).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(clients.id, id));
  return true;
}`
);

// 6. deleteSubmissionAction
code = code.replace(
  `export async function deleteSubmissionAction(id: string) {
  revalidatePath('/dashboard', 'layout');
  await db.delete(floats).where(eq(floats.id, id));
  revalidatePath('/dashboard/float-list');
  revalidatePath('/dashboard/float-list/submissions');
}`,
  `export async function deleteSubmissionAction(id: string) {
  revalidatePath('/dashboard', 'layout');
  const deletedBy = await getDeletedBy();
  await db.update(floats).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(floats.id, id));
  revalidatePath('/dashboard/float-list');
  revalidatePath('/dashboard/float-list/submissions');
}`
);

// 7. deleteFloatListEntryAction
code = code.replace(
  `export async function deleteFloatListEntryAction(id: string) {
  revalidatePath("/dashboard", "layout");
  await db.delete(mandateCandidates).where(eq(mandateCandidates.externalId, id));
  await db.delete(floats).where(eq(floats.candId, id));
  await db.delete(floatFollowUps).where(eq(floatFollowUps.candId, id));
  await db.delete(floatActivities).where(eq(floatActivities.candId, id));
  await db.delete(floatReferences).where(eq(floatReferences.candId, id));
  await db.delete(candidateReports).where(eq(candidateReports.candidateId, id));
  await db.delete(candidateFiles).where(eq(candidateFiles.candId, id));
  await db.delete(candidates).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/candidates");
}`,
  `export async function deleteFloatListEntryAction(id: string) {
  revalidatePath("/dashboard", "layout");
  const deletedBy = await getDeletedBy();
  await db.update(candidates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(candidates.id, id));
  revalidatePath("/dashboard/float-list/database");
  revalidatePath("/dashboard/mandates");
  revalidatePath("/dashboard/float-list/submissions");
  revalidatePath("/dashboard/candidates");
}`
);

// 8. deleteMultipleCandidatesAction
code = code.replace(
  `export async function deleteMultipleCandidatesAction(ids: string[]) {
  if (!ids || ids.length === 0) return;
  revalidatePath("/dashboard", "layout");
  await db.delete(mandateCandidates).where(inArray(mandateCandidates.externalId, ids));
  await db.delete(floats).where(inArray(floats.candId, ids));
  await db.delete(floatFollowUps).where(inArray(floatFollowUps.candId, ids));
  await db.delete(floatActivities).where(inArray(floatActivities.candId, ids));
  await db.delete(floatReferences).where(inArray(floatReferences.candId, ids));
  await db.delete(candidateReports).where(inArray(candidateReports.candidateId, ids));
  await db.delete(candidateFiles).where(inArray(candidateFiles.candId, ids));
  await db.delete(candidates).where(inArray(candidates.id, ids));
  revalidatePath("/dashboard/candidates");
}`,
  `export async function deleteMultipleCandidatesAction(ids: string[]) {
  if (!ids || ids.length === 0) return;
  revalidatePath("/dashboard", "layout");
  const deletedBy = await getDeletedBy();
  await db.update(candidates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(candidates.id, ids));
  revalidatePath("/dashboard/candidates");
}`
);

// 9. deleteMultipleClientsAction
code = code.replace(
  `export async function deleteMultipleClientsAction(ids: string[]) {
  if (!ids || ids.length === 0) return;
  // Let's delete related platform users as well since there could be a FK
  await db.delete(platformUsers).where(inArray(platformUsers.linkedClientId, ids));
  await db.delete(clientNotifications).where(inArray(clientNotifications.clientId, ids));
  await db.delete(clientRemarks).where(inArray(clientRemarks.clientId, ids));
  await db.delete(clients).where(inArray(clients.id, ids));
  revalidatePath("/dashboard/clients");
}`,
  `export async function deleteMultipleClientsAction(ids: string[]) {
  if (!ids || ids.length === 0) return;
  const deletedBy = await getDeletedBy();
  const clientsData = await db.select().from(clients).where(inArray(clients.id, ids));
  const clientNames = clientsData.map(c => c.name);
  if (clientNames.length > 0) {
    await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(mandates.company, clientNames));
  }
  await db.update(clients).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(clients.id, ids));
  revalidatePath("/dashboard/clients");
}`
);

// 10. deleteMultiplePlatformUsersAction
code = code.replace(
  `export async function deleteMultiplePlatformUsersAction(ids: string[]) {
  if (!ids || ids.length === 0) return;
  await db.delete(platformUsers).where(inArray(platformUsers.id, ids));
  revalidatePath("/dashboard");
}`,
  `export async function deleteMultiplePlatformUsersAction(ids: string[]) {
  if (!ids || ids.length === 0) return;
  const deletedBy = await getDeletedBy();
  await db.update(platformUsers).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(platformUsers.id, ids));
  revalidatePath("/dashboard/admin/users");
}`
);

// Append missing functions
if (!code.includes('deleteMultipleFrameworksAction')) {
  code += `\n
export async function deleteMultipleFrameworksAction(ids: string[]) {
  if (!ids || ids.length === 0) return;
  const deletedBy = await getDeletedBy();
  await db.update(frameworks).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(inArray(frameworks.id, ids));
  revalidatePath('/dashboard/frameworks');
}

export async function restoreEntityAction(entityType: string, ids: (string|number)[]) {
  revalidatePath('/dashboard', 'layout');
  if (ids.length === 0) return;
  
  if (entityType === 'clients') {
    const clientsData = await db.select().from(clients).where(inArray(clients.id, ids as string[]));
    const clientNames = clientsData.map(c => c.name);
    if (clientNames.length > 0) {
      await db.update(mandates).set({ isDeleted: false, deletedAt: null }).where(inArray(mandates.company, clientNames));
    }
    await db.update(clients).set({ isDeleted: false, deletedAt: null }).where(inArray(clients.id, ids as string[]));
  } else if (entityType === 'mandates') {
    await db.update(mandates).set({ isDeleted: false, deletedAt: null }).where(inArray(mandates.id, ids as number[]));
  } else if (entityType === 'candidates') {
    await db.update(candidates).set({ isDeleted: false, deletedAt: null }).where(inArray(candidates.id, ids as string[]));
  } else if (entityType === 'floats') {
    await db.update(floats).set({ isDeleted: false, deletedAt: null }).where(inArray(floats.id, ids as string[]));
  } else if (entityType === 'users') {
    await db.update(platformUsers).set({ isDeleted: false, deletedAt: null }).where(inArray(platformUsers.id, ids as string[]));
  } else if (entityType === 'frameworks') {
    await db.update(frameworks).set({ isDeleted: false, deletedAt: null }).where(inArray(frameworks.id, ids as string[]));
  }
}

export async function hardDeleteEntityAction(entityType: string, ids: (string|number)[]) {
  revalidatePath('/dashboard', 'layout');
  if (ids.length === 0) return;
  
  if (entityType === 'clients') {
    await db.delete(clients).where(inArray(clients.id, ids as string[]));
  } else if (entityType === 'mandates') {
    await db.delete(mandates).where(inArray(mandates.id, ids as number[]));
  } else if (entityType === 'candidates') {
    await db.delete(candidates).where(inArray(candidates.id, ids as string[]));
  } else if (entityType === 'floats') {
    await db.delete(floats).where(inArray(floats.id, ids as string[]));
  } else if (entityType === 'users') {
    await db.delete(platformUsers).where(inArray(platformUsers.id, ids as string[]));
  } else if (entityType === 'frameworks') {
    await db.delete(frameworks).where(inArray(frameworks.id, ids as string[]));
  }
}
`;
}

fs.writeFileSync('src/actions/index.ts', code);
console.log('Successfully applied all soft-deletes and deletedBy to src/actions/index.ts');
