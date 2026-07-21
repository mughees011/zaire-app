import os

file_path = 'src/components/modes/EngineerModeV2.js'

with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

target = "const response = await fetch('/engineer/export', {"
replacement = "const response = await fetch(`${resolveApiBase()}/engineer/export`, {"

if target in c:
    c = c.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Fixed export URL!")
else:
    print("Target not found. Current handleDownloadZip code:")
    
    # Just in case, let's print a small chunk to see what's wrong
    idx = c.find("handleDownloadZip")
    if idx != -1:
        print(c[idx:idx+200])
