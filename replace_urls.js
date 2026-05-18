const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert API_BASE_URL at the top if not present
  if (!content.includes('const API_BASE_URL')) {
    // For SettingsModal.js, inject after imports
    content = content.replace(/(import.*?;)/, `$1\nconst API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';\n`);
  } else {
    // For App.js, replace the existing one
    content = content.replace(/const API_BASE_URL = ['"`]http:\/\/localhost:3001['"`];/, "const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';");
  }

  // Replace 'http://127.0.0.1:3001/something' -> `${API_BASE_URL}/something`
  content = content.replace(/['"`]http:\/\/(?:127\.0\.0\.1|localhost):3001([^'"`]*)['"`]/g, '`${API_BASE_URL}$1`');

  fs.writeFileSync(filePath, content, 'utf8');
}

replaceInFile(path.join(__dirname, 'src', 'App.js'));
replaceInFile(path.join(__dirname, 'src', 'SettingsModal.js'));

console.log("Replacement complete.");
