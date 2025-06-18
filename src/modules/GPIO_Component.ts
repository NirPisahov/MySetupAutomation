import { Gpio } from "onoff";
import { CleanableResource } from "../types/CleanableResource";
// cat /sys/kernel/debug/gpio
export type GPIO_Mode = "High" | "Low";

export class GPIO_Component implements CleanableResource {
  protected readonly pin: Gpio;
  private mode: GPIO_Mode;
  private isInitialized: boolean = true;

  constructor(pinNum: number, initMode: GPIO_Mode = "Low") {
    try {
      this.pin = new Gpio(pinNum, "out");
      this.mode = initMode;
      this.setMode(initMode);
    } catch (error) {
      console.error(`Failed to initialize GPIO pin ${pinNum}:`, error);
      throw new Error(`Failed to initialize GPIO pin ${pinNum}`);
    }
  }

  public high(): void {
    if (!this.isInitialized) {
      throw new Error("GPIO component has been cleaned up");
    }
    this.setMode("High");
  }

  public low(): void {
    if (!this.isInitialized) {
      throw new Error("GPIO component has been cleaned up");
    }
    this.setMode("Low");
  }

  public async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    try {
      // this.off();
      this.pin.unexport();
      this.isInitialized = false;
    } catch (error) {
      console.error("Failed to cleanup GPIO:", error);
      throw new Error("Failed to cleanup GPIO");
    }
  }

  protected setMode(mode: GPIO_Mode): void {
    if (!this.isInitialized) {
      throw new Error("GPIO component has been cleaned up");
    }
    try {
      if (mode === "High") {
        this.pin.writeSync(1);
        this.mode = "High";
      } else if (mode === "Low") {
        this.pin.writeSync(0);
        this.mode = "Low";
      } else {
        throw new Error(`Invalid GPIO mode: ${mode}`);
      }
    } catch (error) {
      console.error(`Failed to set GPIO mode to ${mode}:`, error);
      throw new Error(`Failed to set GPIO mode to ${mode}`);
    }
  }

  public getMode(): GPIO_Mode {
    if (!this.isInitialized) {
      throw new Error("GPIO component has been cleaned up");
    }
    return this.mode;
  }
}
