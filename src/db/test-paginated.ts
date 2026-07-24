import { getCandidatesPaginated } from "./queries";

async function main() {
  const result = await getCandidatesPaginated({ limit: 50 });
  const c2 = result.data.find((c: any) => c.id === 'c2');
  console.log("Is c2 in paginated data?", !!c2);
  process.exit(0);
}

main();
