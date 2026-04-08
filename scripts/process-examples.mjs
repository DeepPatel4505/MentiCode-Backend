/**
 * Process Management Examples
 * 
 * These are the testing scripts originally created to figure out the best way to reliably 
 * spawn, track, and kill multi-process terminal windows in Node.js on Windows.
 * 
 * Re-organized here for reference when building other CLI tools in this project.
 */

import { spawnSync, spawn, execSync, exec } from 'child_process';

/**
 * Method 1: The native PowerShell way (CHOSEN APPROACH)
 * Uses PowerShell to launch a detached `cmd.exe` terminal and cleanly captures its exact PID.
 * This is the most reliable way to trace popup windows initialized by `start` logic.
 */
export function testPowerShellPidCapture() {
  const windowTitle = "MyService";
  const servicePath = __dirname;
  
  // Safe argument escaping.
  const argList = `"/k title ${windowTitle} && cd /d ${servicePath} && echo Started through PS Capture && timeout 5"`;
  const psCmd = `(Start-Process cmd.exe -ArgumentList '${argList}' -PassThru).Id`;

  const out = spawnSync('powershell', ['-NoProfile', '-Command', psCmd], { encoding: 'utf8' });
  console.log("Captured Windows Native PID:", out.stdout.trim());
}

/**
 * Method 2: The WMIC Command Line tracing technique
 * Spawns a process uniquely tagged with an environment variable inline, then uses WMIC 
 * to fetch PIDs that match that specific commandline string. Very powerful for detached processes.
 */
export function testWmicProcessTracing() {
  exec(`start "TESTING" cmd /k "set MENTICODE_SIG=MentiCodeRunAll-test && echo Started with WMIC trace"`);
  
  setTimeout(() => {
    try {
      const out = execSync(`wmic process where "name='cmd.exe' and commandline like '%MentiCodeRunAll-%'" get processid`).toString();
      const pids = out.split('\n').map(l => l.trim()).filter(l => l && /\d+/.test(l));
      
      console.log("Found PIDs via WMIC:", pids);
      for (const pid of pids) {
        execSync(`taskkill /T /F /PID ${pid}`);
      }
      console.log("Processes killed via WMIC traces!");
    } catch(e) {
      console.error("WMIC Test Error:", e.message);
    }
  }, 2000);
}

/**
 * Method 3: The standard detached spawn
 * Spawning using detached mode in Node.js. 
 * Can track PID, but struggles to consistently pop open a new visible, titled CMD window on some Windows setups.
 */
export function testDetachedNodeSpawn() {
  const child = spawn('cmd.exe', ['/c', 'echo Hello World && timeout 5'], { detached: true });
  console.log('Detached PID:', child.pid);
  
  setTimeout(() => {
    try {
        execSync(`taskkill /T /F /PID ${child.pid}`);
        console.log("Killed detached process.");
    } catch (e) {}
    process.exit(0);
  }, 2000);
}

// Uncomment one to test:
// testPowerShellPidCapture();
// testWmicProcessTracing();
// testDetachedNodeSpawn();
