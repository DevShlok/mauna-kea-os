import { mapCandidatesAction } from "./src/actions/candidates";

async function test() {
  const res = await mapCandidatesAction(["Full Name", "Job Title", "Email Address"], [{"Full Name": "John Doe", "Job Title": "Dev", "Email Address": "john@example.com"}]);
  console.log(JSON.stringify(res, null, 2));
}

test();
