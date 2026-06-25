import os
import re

def replace_colors(directory):
    count = 0
    pattern1 = re.compile(re.escape('#123D8D'), re.IGNORECASE)
    pattern2 = re.compile(re.escape('#0d2f6e'), re.IGNORECASE)
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = pattern1.sub('#0b1f3a', content)
                    new_content = pattern2.sub('#0b1f3a', new_content)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {filepath}")
                        count += 1
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
    
    print(f"Updated {count} files.")

if __name__ == "__main__":
    replace_colors(r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src")
