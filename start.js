const { spawn } = require('child_process');
const path = require('path');

console.log('=================================================================');
console.log(' Chitkara University SIS Directory & Attendance Portal');
console.log(' Authorized Scope: Batch 2025 AI & ML (Group U25AIML-G13)');
console.log(' Backend: Official SIS Integration API + RBAC (Port 5000)');
console.log(' Frontend: React 19 + Vite Dashboard (Port 5173)');
console.log(' Compliance: India DPDPA 2023 & FERPA Safeguards');
console.log('=================================================================\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Server
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Client
const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\n[Process] Shutting down SIS server and client...');
  try { serverProcess.kill(); } catch (e) {}
  try { clientProcess.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
