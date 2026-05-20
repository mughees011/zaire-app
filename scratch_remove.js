const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');
const casesToRemove = ['File Browser', 'Live Preview', 'Calendar Panel', 'Chart Panel', 'Camera Feed', 'Voice Panel', 'Timeline', 'Research Panel', 'Health Tracker', 'Finance Panel', 'Document Viewer', 'Agent Status'];
const createCaseRegex = (caseName) => new RegExp(`\\s*case '${caseName}': \\{[\\s\\S]*?break;\\s*\\}`, 'g');

for (const c of casesToRemove) {
  code = code.replace(createCaseRegex(c), '');
}

fs.writeFileSync('src/App.js', code);
console.log('Removed cases successfully!');
