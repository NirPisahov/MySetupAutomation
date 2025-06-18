const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PI_IP_FILE_NAME = "pi-ip.txt";

// Get the command from command line arguments
const command = process.argv[2];
if (!command) {
  console.error("Please specify a command to run");
  process.exit(1);
}

// Read the IP from the config file
let piIP = fs
  .readFileSync(path.join(__dirname, PI_IP_FILE_NAME))
  .toString()
  .trim();

if (!piIP || piIP === "") {
  piIP = process.env.PI_DEFAULT_IP;
}

const username = process.env.PI_USERNAME;

// Map commands to their respective SSH commands
const commandMap = {
  start: `cd ~/actuator-control && sudo HOME=/home/${username} node dist/index.js`,
  install: `cd ~/actuator-control && npm install --no-progress --no-audit --no-fund --omit=dev`,
};

if (!commandMap[command]) {
  console.error(`Unknown command: ${command}`);
  console.log("Available commands:", Object.keys(commandMap).join(", "));
  process.exit(1);
}

try {
  console.log(`Executing ${command} on Raspberry Pi at ${piIP}...`);
  execSync(`ssh ${username}@${piIP} '${commandMap[command]}'`, {
    stdio: "inherit",
  });
} catch (error) {
  console.error(`Command failed:`, error.message);
  process.exit(1);
}
