const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PI_IP_FILE_NAME = "pi-ip.txt";

// Read the IP from the config file
let piIP = fs
  .readFileSync(path.join(__dirname, PI_IP_FILE_NAME))
  .toString()
  .trim();

if (!piIP || piIP === "") {
  piIP = process.env.PI_DEFAULT_IP;
}

const username = process.env.PI_USERNAME;

const filesToDeploy = ["dist", "package.json", ".env", "config", "src"];

// Deploy command
const deployCommand = `ssh ${username}@${piIP} 'mkdir -p ~/actuator-control && rm -rf ~/actuator-control/dist && rm -rf ~/actuator-control/src && rm -rf ~/actuator-control/config' && scp -r ${filesToDeploy.join(
  " "
)} ${username}@${piIP}:~/actuator-control`;

try {
  console.log(`Deploying to Raspberry Pi at ${piIP}...`);
  execSync(deployCommand, { stdio: "inherit" });
  console.log("Deployment completed successfully");
} catch (error) {
  console.error("Deployment failed:", error.message);
  process.exit(1);
}
