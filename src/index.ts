import dotenv from "dotenv";
import { LinearActuator } from "./modules/LinearActuator";
import { SetupCache } from "./modules/SetupCache";
import { LED } from "./modules/LED";
import { Positions, Position } from "./types/positions";
import * as fs from "fs/promises";
import * as path from "path";
import { CleanableResource } from "./types/CleanableResource";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "CACHE_FILE_NAME",
  "MOTOR_DRIVER_PIN1",
  "MOTOR_DRIVER_PIN2",
  "LED_MOSFET_PIN",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

async function loadPositions(): Promise<Positions> {
  try {
    const positionsPath = path.join(__dirname, "config", "positions.json");
    const data = await fs.readFile(positionsPath, "utf-8");
    return JSON.parse(data) as Positions;
  } catch (error) {
    console.error("Failed to load positions:", error);
    throw new Error("Failed to load positions configuration");
  }
}

async function printInfo(cache: SetupCache): Promise<void> {
  const data = await cache.getData();
  console.log("Current state:");
  console.log(JSON.stringify(data, null, 2));
}

async function setStroke(
  actuator: LinearActuator,
  stroke: number
): Promise<void> {
  await actuator.setPositionAsync(stroke);
}

async function setLED(led: LED, state: "on" | "off"): Promise<void> {
  led.setState(state);
}

async function setMode(
  actuator: LinearActuator,
  led: LED,
  positionName: string
): Promise<void> {
  const positions = await loadPositions();
  const position = positions[positionName];

  if (!position) {
    throw new Error(`Position "${positionName}" not found in configuration`);
  }

  await setStroke(actuator, position.stroke);
  await setLED(led, position.led);
}

async function main() {
  const cache = new SetupCache(process.env.CACHE_FILE_NAME!);

  try {
    // Load initial state from cache
    const cacheData = await cache.getData();

    // Initialize the linear actuator
    const actuator = new LinearActuator({
      pin1: parseInt(process.env.MOTOR_DRIVER_PIN1!),
      pin2: parseInt(process.env.MOTOR_DRIVER_PIN2!),
      speed: 5, // mm per second
      strokeLength: 150, // mm
      initialPosition: cacheData.actuatorPosition || 0,
      onCurrentPositionChange: async (position) => {
        await cache.update({ actuatorPosition: position });
      },
    });

    // Initialize the led strip
    const ledStrip = new LED({
      mosfetPin: parseInt(process.env.LED_MOSFET_PIN!),
      initialState: cacheData.ledState,
      onCurrentStateChange: async (state) => {
        await cache.update({ ledState: state });
      },
    });

    // Handle command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case "mode":
        if (!args[1]) {
          throw new Error("Position name is required for 'mode' command");
        }
        await setMode(actuator, ledStrip, args[1]);
        break;

      case "stroke":
        const stroke = parseInt(args[1]);
        if (isNaN(stroke)) {
          throw new Error("Valid stroke number is required");
        }
        await setStroke(actuator, stroke);
        break;

      case "led":
        const ledState = args[1] as "on" | "off";
        if (ledState !== "on" && ledState !== "off") {
          throw new Error("LED state must be 'on' or 'off'");
        }
        await setLED(ledStrip, ledState);
        break;

      case "info":
        await printInfo(cache);
        break;

      default:
        console.log("Available commands:");
        console.log(
          "  mode <position-name>  - Set position from configuration"
        );
        console.log("  stroke <number>       - Set stroke length in mm");
        console.log("  led <on/off>          - Set LED state");
        console.log("  info                  - Print current state");
        break;
    }

    // Clean up resources
    await cleanup(actuator, ledStrip);
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

async function cleanup(...cleanableResources: CleanableResource[]) {
  for (const resource of cleanableResources) {
    await resource.cleanup();
  }
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
