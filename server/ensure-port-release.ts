
import { exec } from 'child_process';

console.log("Checking for processes using port 5000...");

exec('lsof -i :5000', (error, stdout, stderr) => {
  if (stdout) {
    console.log("Found processes using port 5000:");
    console.log(stdout);
    
    exec("kill $(lsof -t -i:5000)", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error killing processes: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
        return;
      }
      console.log("Successfully killed processes using port 5000");
    });
  } else {
    console.log("No processes found using port 5000");
  }
});


import { exec } from 'child_process';

// Function to check if a port is in use
function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`lsof -i:${port}`, (error, stdout) => {
      if (error) {
        // If command fails, port is likely not in use
        resolve(false);
        return;
      }
      resolve(!!stdout);
    });
  });
}

// Function to kill process using a port
function killProcessOnPort(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`fuser -k ${port}/tcp`, (error) => {
      if (error) {
        console.warn(`Warning: Failed to kill process on port ${port}: ${error.message}`);
      } else {
        console.log(`Successfully killed process on port ${port}`);
      }
      resolve();
    });
  });
}

async function ensurePortsReleased() {
  const portsToCheck = [8080, 5000, 5001, 3000];
  
  console.log('Checking for processes using required ports...');
  
  for (const port of portsToCheck) {
    const isInUse = await checkPort(port);
    if (isInUse) {
      console.log(`Port ${port} is in use. Attempting to release...`);
      await killProcessOnPort(port);
      
      // Verify port was released
      const stillInUse = await checkPort(port);
      if (stillInUse) {
        console.warn(`Warning: Port ${port} is still in use. Deployment may fail.`);
      } else {
        console.log(`Successfully released port ${port}`);
      }
    } else {
      console.log(`Port ${port} is available`);
    }
  }
  
  console.log('Port check complete');
}

// Run the function
ensurePortsReleased().catch(console.error);
