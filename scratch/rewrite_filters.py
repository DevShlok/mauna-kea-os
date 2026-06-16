import re
import os

filepath = r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src\app\dashboard\candidates\CandidatesClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove state
content = re.sub(r'const \[priorEmployersFilter, setPriorEmployersFilter\] = useState<string\[\]>\(\[\]\);\n\s*', '', content)

# 2. Remove unique array
content = re.sub(r'const uniquePriorEmployers = Array\.from\(new Set\(candidates\.flatMap\(c => \{\n\s*if \(\!c\.expTags\) return \[\];\n\s*return c\.expTags\.map\(\(t: string\) => \{\n\s*const parts = t\.split\(\' - \'[^}]*\}\)\.filter\(Boolean\)\)\)\.sort\(\);\n\s*', '', content)

# 3. Remove match logic
content = re.sub(r'const matchPriorEmployer = priorEmployersFilter\.length === 0 \|\| \(c\.expTags && c\.expTags\.some\(\(t: string\) => priorEmployersFilter\.some\(pe => t\.includes\(pe\)\)\)\);\n\s*', '', content)

# 4. Remove from return matchSearch && ...
content = content.replace(' && matchPriorEmployer', '')

# 5. Remove from clearAllFilters condition
content = content.replace('|| priorEmployersFilter.length > 0 ', '')

# 6. Remove from clearAllFilters body
content = re.sub(r'setPriorEmployersFilter\(\[\]\);\n\s*', '', content)

# 7. Remove UI block
ui_block = r"""            <div>
              <label className="block text-\[11px\] font-bold tracking-wider uppercase text-\[#8a93a3\] mb-1\.5">Prior employer \(ex-\)</label>
              <MultiSelect options=\{uniquePriorEmployers\} selected=\{priorEmployersFilter\} onChange=\{setPriorEmployersFilter\} placeholder="Any" />
            </div>\n\s*"""
content = re.sub(ui_block, '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
