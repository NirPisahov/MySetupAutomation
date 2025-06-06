import dotenv from "dotenv";
import { LinearActuator } from "./modules/LinearActuator";
import { SetupCache } from "./modules/SetupCache";
dotenv.config();

const cache = new SetupCache(process.env.CACHE_FILE_NAME!);

async function main() {
  await cache.load();
  const smallActuator = new LinearActuator({
    relayPin: parseInt(process.env.SMALL_LINEAR_ACTUATOR_RELAY_PIN!),
    mosfetPin: parseInt(process.env.SMALL_LINEAR_ACTUATOR_MOSFET_PIN!),
    speed: 5,
    strokeLength: 150,
    initialPosition: cache.data.actuatorPosition,
  });

  await smallActuator.calibrate();
  smallActuator.cleanup();
}

(async () => {
  await main();
})();
