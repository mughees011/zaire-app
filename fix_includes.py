import os

file_path = 'src/components/modes/EngineerModeV2.js'

with open(file_path, 'r', encoding='utf-8') as f:
    c = f.read()

# Fix buildLogs
target1 = " className={`e-term-line ${log.includes('phase:test') ? 'e-term-info' : log.includes('repair') ? 'e-term-warn' : ''}`}>{log}</div>"
replacement1 = " className={`e-term-line ${(log || '').includes('phase:test') ? 'e-term-info' : (log || '').includes('repair') ? 'e-term-warn' : ''}`}>{log}</div>"

# Fix deployLogs
target2 = " className={log.includes('COMPLETE') ? 'mt-2 text-white font-bold' : ''}>{log}</div>"
replacement2 = " className={(log || '').includes('COMPLETE') ? 'mt-2 text-white font-bold' : ''}>{log}</div>"

if target1 in c:
    c = c.replace(target1, replacement1)
    print("Fixed target1")
else:
    print("Target1 not found")

if target2 in c:
    c = c.replace(target2, replacement2)
    print("Fixed target2")
else:
    print("Target2 not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(c)
