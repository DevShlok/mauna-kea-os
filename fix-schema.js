const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

// 1. Remove from mandates
schema = schema.replace(
  "  createdAt: datetime('created_at').default(sql`now()`),\n  updatedAt: datetime('updated_at').default(sql`now()`),\n  updatedBy: varchar('updated_by', { length: 255 }),\n});",
  "  createdAt: datetime('created_at').default(sql`now()`),\n});"
);

// 2. Add to candidates
const candidatesEndStr = "  deletedBy: varchar('deleted_by', { length: 255 }),\n  createdAt: datetime('created_at').default(sql`now()`),\n});";

if (schema.includes(candidatesEndStr)) {
  schema = schema.replace(
    candidatesEndStr,
    "  deletedBy: varchar('deleted_by', { length: 255 }),\n  createdAt: datetime('created_at').default(sql`now()`),\n  updatedAt: datetime('updated_at').default(sql`now()`),\n  updatedBy: varchar('updated_by', { length: 255 }),\n});"
  );
}

fs.writeFileSync('src/db/schema.ts', schema);
console.log('Fixed schema.ts');
