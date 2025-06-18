import { GPIO_Component } from "./GPIO_Component";

export type Direction = "extend" | "retract";

export class MotorDriver {
  private readonly pin1: GPIO_Component;
  private readonly pin2: GPIO_Component;
  private isMoving: boolean = false;

  constructor(pin1Number: number, pin2Number: number) {
    this.pin1 = new GPIO_Component(pin1Number);
    this.pin2 = new GPIO_Component(pin2Number);
  }

  public async move(direction: Direction): Promise<void> {
    if (this.isMoving) {
      throw new Error("Motor is already moving");
    }

    try {
      this.isMoving = true;
      console.log(`Starting to ${direction} actuator...`);

      if (direction === "retract") {
        this.pin1.high();
        this.pin2.low();
      } else {
        this.pin1.low();
        this.pin2.high();
      }
    } catch (error) {
      console.error(`Failed to move motor: ${error}`);
      throw new Error(`Failed to move motor: ${error}`);
    }
  }

  public stop(): void {
    if (!this.isMoving) return;

    console.log("Stopping motor...");
    this.pin1.low();
    this.pin2.low();
    this.isMoving = false;
  }

  public cleanup(): void {
    console.log("Cleaning up motor driver GPIOs...");
    this.stop();
    this.pin1.cleanup();
    this.pin2.cleanup();
  }
}
