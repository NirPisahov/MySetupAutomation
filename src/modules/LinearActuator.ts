import { ok } from "node:assert";
import { inBounds, sleep } from "../utils";
import { MotorDriver, Direction } from "./MotorDriver";
import { CleanableResource } from "../types/CleanableResource";

export interface LinearActuatorProps {
  readonly pin1: number;
  readonly pin2: number;
  readonly speed: number; // mm per second
  readonly strokeLength: number; // mm
  readonly initialPosition: number;
  readonly onCurrentPositionChange?: (position: number) => Promise<unknown>;
}

// Safety factor to prevent mechanical damage
const SAFETY_FACTOR = 1.1;

export class LinearActuator implements CleanableResource {
  public readonly props: LinearActuatorProps;
  private currentPosition: number; // mm
  protected readonly motorDriver: MotorDriver;

  private isMoving: boolean = false;

  protected readonly MAX_MOVEMENT_DISTANCE: number;
  protected readonly MAX_MOVEMENT_DURATION: number;

  constructor(props: LinearActuatorProps) {
    this.props = props;
    this.currentPosition = this.props.initialPosition;
    this.motorDriver = new MotorDriver(props.pin1, props.pin2);

    // Calculate maximum safe movement distance and duration
    this.MAX_MOVEMENT_DISTANCE = props.strokeLength * SAFETY_FACTOR;
    this.MAX_MOVEMENT_DURATION = this.toDurationMs(this.MAX_MOVEMENT_DISTANCE);
  }

  public async moveActuator(
    direction: Direction,
    durationMs: number
  ): Promise<void> {
    ok(
      durationMs >= 0 && durationMs <= this.MAX_MOVEMENT_DURATION,
      `Invalid duration: ${durationMs}ms. Must be between 0 and ${this.MAX_MOVEMENT_DURATION}ms`
    );
    ok(
      direction === "extend" || direction === "retract",
      `Invalid direction: ${direction}`
    );

    if (durationMs === 0) return;
    if (this.isMoving) {
      throw new Error("Actuator is already moving");
    }

    try {
      this.isMoving = true;
      console.log(`Starting to ${direction} actuator for ${durationMs}ms...`);

      await this.motorDriver.move(direction);
      await sleep(durationMs);

      // Calculate distance moved based on duration and speed
      const distance = (durationMs / 1000) * this.props.speed; // Convert ms to s, then multiply by speed
      let newPosition = this.currentPosition;
      if (direction === "extend") {
        newPosition += distance;
      } else {
        newPosition -= distance;
      }

      this.setPositionValue(newPosition);
      console.log(
        `Finished ${direction} to position ${newPosition.toFixed(2)}mm`
      );
    } catch (error) {
      console.error(`Failed to move actuator: ${error}`);
      throw new Error(`Failed to move actuator: ${error}`);
    } finally {
      this.stop();
      this.isMoving = false;
    }
  }

  public async moveActuatorByDistance(
    direction: Direction,
    distance: number
  ): Promise<void> {
    ok(
      distance >= 0 && distance <= this.MAX_MOVEMENT_DISTANCE,
      `Invalid distance: ${distance}mm. Must be between 0 and ${this.MAX_MOVEMENT_DISTANCE}mm`
    );
    if (distance === 0) return;

    const duration = this.toDurationMs(distance);
    await this.moveActuator(direction, duration);
  }

  public async fullyExtend(): Promise<void> {
    console.log("Fully extending actuator...");
    // Calculate remaining distance to full extension
    const remainingDistance = this.props.strokeLength - this.currentPosition;
    await this.moveActuatorByDistance("extend", remainingDistance);
  }

  public async fullyRetract(): Promise<void> {
    console.log("Fully retracting actuator...");
    // Calculate distance to full retraction
    const distanceToRetract = this.currentPosition;
    await this.moveActuatorByDistance("retract", distanceToRetract);
  }

  public getPosition(): number {
    return this.currentPosition;
  }

  public async setPositionAsync(position: number): Promise<void> {
    ok(
      position >= 0 && position <= this.props.strokeLength,
      `Invalid position: ${position}mm. Must be between 0 and ${this.props.strokeLength}mm`
    );

    if (position === this.getPosition()) return;

    console.log(`Moving actuator to ${position}mm height...`);
    const distance = Math.abs(position - this.getPosition());
    const direction = position > this.getPosition() ? "extend" : "retract";

    await this.moveActuatorByDistance(direction, distance);
  }

  public stop(): void {
    if (!this.isMoving) return;

    console.log("Stopping actuator...");
    this.motorDriver.stop();
  }

  public async calibrate(): Promise<void> {
    console.log("Calibrating actuator...");
    // Move to fully retracted position
    await this.moveActuator("retract", this.MAX_MOVEMENT_DURATION);
    // Reset position to 0
    this.setPositionValue(0);
  }

  public async cleanup(): Promise<void> {
    console.log("Cleaning up actuator...");
    this.stop();
    this.motorDriver.cleanup();
  }

  private toDurationMs(distance: number): number {
    // Convert distance (mm) to duration (ms) based on speed (mm/s)
    return Math.ceil((distance * 1000) / this.props.speed);
  }

  private setPositionValue(position: number): void {
    this.currentPosition = inBounds(position, 0, this.props.strokeLength);
    console.log(
      `Position set to ${this.currentPosition.toFixed(2)}mm height...`
    );

    if (this.props.onCurrentPositionChange) {
      this.props
        .onCurrentPositionChange(this.currentPosition)
        .catch((error) => {
          console.error("Failed to notify position change:", error);
        });
    }
  }
}
