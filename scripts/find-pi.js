const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PI_IP_FILE_NAME = "pi-ip.txt";

// Log environment variables for debugging
console.log("Environment variables loaded:");
console.log("PI_HOSTNAME:", process.env.PI_HOSTNAME);

function findPiIP() {
  try {
    // First try to install arp-scan if it's not already installed
    try {
      execSync("which arp-scan", { stdio: "ignore" });
    } catch (e) {
      // console.log("Installing arp-scan...");
      // execSync("brew install arp-scan", { stdio: "inherit" });
    }

    // Get the network interface
    const networkInterface = execSync(
      "route get 8.8.8.8 | grep interface | awk '{print $2}'"
    )
      .toString()
      .trim();
    console.log("Using network interface:", networkInterface);

    // Scan the network for Raspberry Pi devices
    const scanResult = execSync(
      `sudo arp-scan --interface=${networkInterface} --localnet`
    ).toString();

    // Look for Raspberry Pi MAC address prefix (typically starts with b8:27:eb or dc:a6:32)
    const piLines = scanResult
      .split("\n")
      .filter(
        (line) =>
          line.includes("b8:27:eb") ||
          line.includes("dc:a6:32") ||
          line.includes(process.env.PI_HOSTNAME)
      );

    if (piLines.length === 0) {
      throw new Error("No Raspberry Pi found on the network");
    }

    // Extract IP address from the first matching line
    const ip = piLines[0].split("\t")[0];
    return ip;
  } catch (error) {
    console.error("Error finding Raspberry Pi:", error.message);
    console.log(
      "Make sure your Raspberry Pi is connected to the network and powered on."
    );
    process.exit(1);
  }
}

// Save the IP to a temporary file for other scripts to use
const ip = findPiIP();
fs.writeFileSync(path.join(__dirname, PI_IP_FILE_NAME), ip);

console.log(`Found Raspberry Pi at IP: ${ip}`);
