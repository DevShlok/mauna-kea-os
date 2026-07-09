const fs = require('fs');
const path = require('path');
const files = ['ClientDashboard.tsx', 'ClientTopbar.tsx', 'ClientSidebar.tsx', 'ClientMandateDetail.tsx'];
files.forEach(f => {
  const p = path.join('src/features/client/components', f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/from\s+['"]\.\.\/context\/ClientPortalContext['"]/g, 'from "@/features/client/context/ClientPortalContext"');
    fs.writeFileSync(p, content);
    console.log('Fixed', p);
  }
});
