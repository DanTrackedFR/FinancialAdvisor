
// Pre-deployment script to check port availability
import net from 'net';

// Function to check if a port is in use
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      console.log(`Port ${port} is already in use`);
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      console.log(`Port ${port} is available`);
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

// Check deployment port
const port = Number(process.env.PORT) || 8080;
console.log(`Checking availability of port ${port}...`);

isPortAvailable(port).then(available => {
  if (!available) {
    console.log(`Warning: Port ${port} is already in use. The deployment may fail.`);
    console.log('Consider releasing any processes using this port before deployment.');
  } else {
    console.log(`Port ${port} is available and ready for deployment.`);
  }
});
