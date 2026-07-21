import os

file_path = 'src/components/modes/EngineerModeV2.js'

with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

target = "body: JSON.stringify({ projectName: architecturePlan.normalizedName })"
replacement = "body: JSON.stringify({ projectId: architecturePlan.normalizedName, files: toEngineerFileList(fileArtifacts) })"

if target in c:
    c = c.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Fixed export payload!")
else:
    print("Target not found.")
