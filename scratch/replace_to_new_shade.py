import os

def replace_hex(directory):
    count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content.replace('#0b1f3a', '#133255')
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {filepath}")
                        count += 1
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
    
    print(f"Updated {count} files.")

if __name__ == "__main__":
    replace_hex(r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src")
