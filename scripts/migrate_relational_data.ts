import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

async function migrateRelationalData() {
  const rawUrl = (process.env.DATABASE_URL || '').split('?')[0];
  console.log('Connecting to database...');
  const sql = postgres(rawUrl);

  try {
    console.log('1. Adding foreign key columns...');
    await sql`ALTER TABLE mandates ADD COLUMN IF NOT EXISTS client_id varchar(50) REFERENCES clients(id) ON DELETE SET NULL;`;
    await sql`ALTER TABLE floats ADD COLUMN IF NOT EXISTS client_id varchar(50) REFERENCES clients(id) ON DELETE SET NULL;`;
    await sql`ALTER TABLE floats ADD COLUMN IF NOT EXISTS mandate_id int REFERENCES mandates(id) ON DELETE SET NULL;`;
    await sql`ALTER TABLE float_followups ADD COLUMN IF NOT EXISTS float_id varchar(50) REFERENCES floats(id) ON DELETE CASCADE;`;
    await sql`ALTER TABLE float_activities ADD COLUMN IF NOT EXISTS float_id varchar(50) REFERENCES floats(id) ON DELETE CASCADE;`;
    console.log('✅ Foreign key columns added successfully.');

    console.log('2. Backfilling Mandate <-> Client foreign keys...');
    const allMandates = await sql`SELECT id, company, client_id FROM mandates;`;
    const allClients = await sql`SELECT id, name FROM clients;`;

    const clientNameMap = new Map<string, string>();
    allClients.forEach(c => clientNameMap.set(c.name.trim().toLowerCase(), c.id));

    let updatedMandatesCount = 0;
    let createdClientsCount = 0;

    for (const m of allMandates) {
      if (!m.company) continue;
      const compKey = m.company.trim().toLowerCase();
      let clientId = clientNameMap.get(compKey);

      // Auto-create client if it doesn't exist for this mandate company
      if (!clientId) {
        const newClientId = `CL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const newSlug = m.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await sql`
          INSERT INTO clients (id, name, slug, account_id, status) 
          VALUES (${newClientId}, ${m.company}, ${newSlug}, ${'ACC-' + Math.floor(100 + Math.random() * 900)}, 'Active')
          ON CONFLICT (id) DO NOTHING;
        `;
        clientId = newClientId;
        clientNameMap.set(compKey, newClientId);
        createdClientsCount++;
      }

      if (clientId && m.client_id !== clientId) {
        await sql`UPDATE mandates SET client_id = ${clientId} WHERE id = ${m.id};`;
        updatedMandatesCount++;
      }
    }
    console.log(`✅ Backfilled ${updatedMandatesCount} mandates with client_id (created ${createdClientsCount} missing clients).`);

    console.log('3. Backfilling Floats <-> Client & Mandate foreign keys...');
    const allFloats = await sql`SELECT id, client, role, client_id, mandate_id FROM floats;`;
    const fullMandates = await sql`SELECT id, company, role FROM mandates;`;

    let updatedFloatsCount = 0;
    for (const f of allFloats) {
      let updates: any = {};
      if (f.client) {
        const cId = clientNameMap.get(f.client.trim().toLowerCase());
        if (cId) updates.client_id = cId;
      }

      if (f.client && f.role) {
        const matchedMandate = fullMandates.find(
          m => m.company?.trim().toLowerCase() === f.client.trim().toLowerCase() && 
               m.role?.trim().toLowerCase() === f.role.trim().toLowerCase()
        );
        if (matchedMandate) updates.mandate_id = matchedMandate.id;
      }

      if (updates.client_id || updates.mandate_id) {
        await sql`
          UPDATE floats 
          SET 
            client_id = COALESCE(${updates.client_id || null}, client_id),
            mandate_id = COALESCE(${updates.mandate_id || null}, mandate_id)
          WHERE id = ${f.id};
        `;
        updatedFloatsCount++;
      }
    }
    console.log(`✅ Backfilled ${updatedFloatsCount} floats with client_id and mandate_id.`);

  } catch (err: any) {
    console.error('❌ MIGRATION_ERROR:', err.message);
  } finally {
    await sql.end({ timeout: 5 });
    process.exit(0);
  }
}

migrateRelationalData();
