const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PI_IP_FILE_NAME = "pi-ip.txt";

// Read the IP from the file
let piIP = fs
  .readFileSync(path.join(__dirname, PI_IP_FILE_NAME))
  .toString()
  .trim();

if (!piIP || piIP === "") {
  piIP = process.env.PI_DEFAULT_IP;
}

const username = process.env.PI_USERNAME;

try {
  console.log(`Connecting to Raspberry Pi at ${piIP}...`);
  execSync(`ssh ${username}@${piIP}`, { stdio: "inherit" });
} catch (error) {
  console.error(`Connection failed:`, error.message);
  process.exit(1);
}
