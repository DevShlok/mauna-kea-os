import os
import re

def replace_tailwind_blues(directory):
    count = 0
    # We want to replace text-blue-900, bg-blue-800, etc. with their [#0b1f3a] equivalent.
    # We target 600, 700, 800, 900 which are typically the dark shades used for buttons and main text.
    
    replacements = [
        (r'bg-blue-(600|700|800|900)', r'bg-[#0b1f3a]'),
        (r'text-blue-(600|700|800|900)', r'text-[#0b1f3a]'),
        (r'border-blue-(600|700|800|900)', r'border-[#0b1f3a]'),
        (r'ring-blue-(600|700|800|900)', r'ring-[#0b1f3a]'),
        (r'hover:bg-blue-(600|700|800|900)', r'hover:bg-[#0b1f3a]'),
        (r'hover:text-blue-(600|700|800|900)', r'hover:text-[#0b1f3a]'),
        (r'hover:border-blue-(600|700|800|900)', r'hover:border-[#0b1f3a]'),
        (r'group-hover:bg-blue-(600|700|800|900)', r'group-hover:bg-[#0b1f3a]'),
        (r'group-hover:text-blue-(600|700|800|900)', r'group-hover:text-[#0b1f3a]'),
        (r'focus:border-blue-(600|700|800|900)', r'focus:border-[#0b1f3a]'),
        (r'focus:ring-blue-(600|700|800|900)', r'focus:ring-[#0b1f3a]'),
    ]
    
    compiled_replacements = [(re.compile(p), r) for p, r in replacements]

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for pattern, repl in compiled_replacements:
                        new_content = pattern.sub(repl, new_content)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {filepath}")
                        count += 1
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
    
    print(f"Updated {count} files.")

if __name__ == "__main__":
    replace_tailwind_blues(r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src")
