import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { join } from 'node:path';

const root = process.cwd();

const loadDotEnvFile = (fileName, targetEnv) => {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx <= 0) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!Object.prototype.hasOwnProperty.call(targetEnv, key)) {
      targetEnv[key] = value;
    }
  }
};

const env = { ...process.env };
loadDotEnvFile('.env', env);
loadDotEnvFile('.env.local', env);

const isPortAvailable = (port) => new Promise((resolve) => {
  const server = net.createServer();
  server.unref();
  server.once('error', () => resolve(false));
  server.listen({ port }, () => {
    server.close(() => resolve(true));
  });
});

const findFreePort = async (startPort, attempts = 20) => {
  for (let port = startPort; port < startPort + attempts; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`Unable to find a free port starting at ${startPort}`);
};

const functionsPort = await findFreePort(9999);
const angularPort = 4200;

env.NETLIFY_FUNCTIONS_PORT = String(functionsPort);
env.ANGULAR_PORT = String(angularPort);

console.log(`Using Angular port ${angularPort} and Netlify Functions port ${functionsPort}.`);

const commonSpawnOptions = {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: false
};

let shuttingDown = false;
const children = [];

const stopAll = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => process.exit(code), 250);
};

const startProcess = (command, args, label) => {
  const child = spawn(command, args, commonSpawnOptions);
  children.push(child);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    const exitCode = typeof code === 'number' ? code : 1;
    console.error(`${label} exited${signal ? ` with signal ${signal}` : ''}.`);
    stopAll(exitCode);
  });

  return child;
};

const netlifyArgs = ['netlify', 'functions:serve', '--functions', 'netlify/functions', '--port', String(functionsPort)];
const angularArgs = ['ng', 'serve', '--port', String(angularPort), '--proxy-config', 'proxy.conf.cjs'];

if (process.platform === 'win32') {
  startProcess('cmd.exe', ['/d', '/s', '/c', `npx ${netlifyArgs.join(' ')}`], 'Netlify functions');
  startProcess('cmd.exe', ['/d', '/s', '/c', `npx ${angularArgs.join(' ')}`], 'Angular dev server');
} else {
  startProcess('npx', netlifyArgs, 'Netlify functions');
  startProcess('npx', angularArgs, 'Angular dev server');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stopAll(0));
}