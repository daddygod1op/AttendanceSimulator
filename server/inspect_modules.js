const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'last_response.html'), 'utf8');
const match = html.match(/var msg\s*=\s*(\[\{.*?\}\]);/s);
if (match) {
  const modules = JSON.parse(match[1]);
  console.log('Available Modules in Student Portal:');
  modules.forEach(m => {
    console.log(`- [${m.moduleId}] ${m.moduleName} -> ${m.moduleLink} (${m.moduleDescription || ''})`);
  });
} else {
  console.log('Could not parse var msg array');
}
