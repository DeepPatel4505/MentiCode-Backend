import { execSync, spawnSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const childPids = [];

function cleanupAndExit() {
  console.log(`\n\x1b[31mReceived termination signal. Shutting down all spawned terminals and services...\x1b[0m`);
  for (const pid of childPids) {
    try {
      // /T = tree kill (kills child node.exe processes), /F = force
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors if process already died
    }
  }
  console.log(`\x1b[32mCleanup complete. Goodbye!\x1b[0m`);
  process.exit(0);
}

// Handle exit signals
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift();

  if (!command) {
    console.error("Please specify an npm command to run (e.g., dev, start)");
    process.exit(1);
  }

  const servicesDir = join(__dirname, '../services');

  const validServices = readdirSync(servicesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => existsSync(join(servicesDir, name, 'package.json')));

  const runnableServices = validServices.map(service => ({
    name: service,
    serviceDir: service,
    npmCommand: command
  }));

  if (validServices.includes('analyzer-service')) {
    runnableServices.push({
      name: 'analyzer-service-worker',
      serviceDir: 'analyzer-service',
      npmCommand: 'worker'
    });
  }

  let requestedServices = args.flatMap(arg => arg.split(',')).map(s => s.trim()).filter(Boolean);

  if (requestedServices.length === 0) {
    console.log(`\x1b[36mAvailable services:\x1b[0m`);
    runnableServices.forEach((s, i) => console.log(`  \x1b[33m${i + 1}.\x1b[0m ${s.name}`));
    console.log("");
    
    console.log(`You can run specific services by numbers (e.g. "1, 3, 4") or names (e.g. "auth, gateway").`);
    const answer = await askQuestion("Enter your choice, or press ENTER to run ALL services: ");
    
    if (answer.trim()) {
      requestedServices = answer.split(',').map(s => s.trim()).filter(Boolean);
      
      requestedServices = requestedServices.map(req => {
        if (/^\d+$/.test(req)) {
          const index = parseInt(req, 10) - 1;
          if (index >= 0 && index < runnableServices.length) {
            return runnableServices[index].name;
          }
        }
        return req;
      });
    }
  }

  let servicesToRun = runnableServices.map(s => s.name);

  if (requestedServices.length > 0) {
    servicesToRun = [];
    requestedServices.forEach(req => {
      const matched = runnableServices.find(s => 
        s.name.toLowerCase() === req.toLowerCase() || 
        s.name.toLowerCase().includes(req.toLowerCase())
      );
      
      if (matched) {
        if (!servicesToRun.includes(matched.name)) {
          servicesToRun.push(matched.name);
        }
      } else {
        console.warn(`\x1b[31mWarning: Service matching '${req}' not found or no package.json.\x1b[0m`);
      }
    });

    if (servicesToRun.length === 0) {
      console.error("\x1b[31mError: No valid services found to run.\x1b[0m");
      process.exit(1);
    }
  }

  console.log(`\x1b[32m\nStarting the following services for '${command}':\x1b[0m`);
  console.log(servicesToRun.map(s => ` - ${s}`).join('\n'));
  console.log("\n\x1b[36m>> Press Ctrl+C at any time to immediately close all terminals and stop services <<\x1b[0m\n");

  function startTerminal(title, servicePath, npmCommand) {
    // We launch via PowerShell so we can cleanly capture the exact PID of the new command window.
    // ArgumentList is wrapped in single quotes so double quotes inside are passed straight to the CMD process.
    const psCmd = `(Start-Process cmd.exe -ArgumentList '/k title ${title} && cd /d "${servicePath}" && npm run ${npmCommand}' -PassThru).Id`;

    try {
        const out = spawnSync('powershell', ['-NoProfile', '-Command', psCmd], { encoding: 'utf8' });
        const pid = out.stdout.trim();
        if (pid && !isNaN(pid)) {
          childPids.push(pid);
        } else {
          console.error(`Failed to capture PID for ${title}`);
        }
    } catch(e) {
        console.error(`Error starting ${title}:`, e.message);
    }
  }

  servicesToRun.forEach(serviceName => {
    const runnableService = runnableServices.find(s => s.name === serviceName);
    if (!runnableService) {
      console.warn(`\x1b[31mWarning: Skipping unknown runnable service '${serviceName}'.\x1b[0m`);
      return;
    }

    const servicePath = join(servicesDir, runnableService.serviceDir);
    startTerminal(runnableService.name, servicePath, runnableService.npmCommand);
  });

  // Keep the process alive so we can capture Ctrl+C
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch(console.error);
