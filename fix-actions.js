const fs = require('fs');

let code = fs.readFileSync('src/actions/index.ts', 'utf8');

// Fix updateClientAction
const updateActionRegex = /export async function updateClientAction\(id: string, data: any\) \{[\s\S]*?return true;\r?\n\}/;
const updateActionFixed = `export async function updateClientAction(id: string, data: any) {
  revalidatePath("/dashboard/clients");
  await db.update(clients).set({
    name: data.name,
    accountId: data.accountId,
    vertical: data.vertical,
    owner: data.owner,
    status: data.status || "Active",
    legalEntityName: data.legalEntityName || null,
    contacts: data.contacts || [],
  }).where(eq(clients.id, id));
  return true;
}`;
code = code.replace(updateActionRegex, updateActionFixed);

// Fix deleteClientAction
const deleteActionRegex = /export async function deleteClientAction\(id: string\) \{[\s\S]*?return true;\r?\n\}/;
const deleteActionFixed = `export async function deleteClientAction(id: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  const deletedBy = await getDeletedBy();
  if (client) {
    await db.update(mandates).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(mandates.company, client.name));
  }
  await db.update(clients).set({ isDeleted: true, deletedAt: new Date(), deletedBy }).where(eq(clients.id, id));
  return true;
}`;
code = code.replace(deleteActionRegex, deleteActionFixed);

fs.writeFileSync('src/actions/index.ts', code);
console.log("Fixed actions");
