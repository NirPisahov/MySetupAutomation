import { ok } from "node:assert";
import { inBounds, sleep } from "../utils";
import { GPIO_Component } from "./GPIO_Component";

type Direction = "extend" | "retract";
type CurrentFlowMode = "on" | "off";

type LinearActuatorProps = {
  readonly relayPin: number;
  readonly mosfetPin: number;
  readonly speed: number; // mm per second
  readonly strokeLength: number; // mm
  readonly initialPosition: number;
  readonly onCurrentPositionChange?: (position: number) => Promise<unknown>;
};

const factor = 1.1;

export class LinearActuator {
  public readonly props: LinearActuatorProps;
  private currentPosition: number; // mm

  protected readonly MAX_MOVEMENT_DURATION: number;
  protected readonly MAX_MOVEMENT_DISTANCE: number;

  protected readonly relay: GPIO_Component;
  protected readonly mosfet: GPIO_Component;

  constructor(props: LinearActuatorProps) {
    this.props = props;
    this.currentPosition = this.props.initialPosition;

    this.relay = new GPIO_Component(props.relayPin);
    this.mosfet = new GPIO_Component(props.mosfetPin);

    this.MAX_MOVEMENT_DISTANCE = props.strokeLength * factor;
    this.MAX_MOVEMENT_DURATION = this.toDurationMs(this.MAX_MOVEMENT_DISTANCE);
  }

  public async moveActuator(direction: Direction, durationMs: number) {
    ok(
      durationMs >= 0 && durationMs <= this.MAX_MOVEMENT_DURATION,
      "Invalid duration"
    );
    ok(direction === "extend" || direction === "retract", "Invalid direction");
    if (durationMs === 0) return;

    console.log(`Starting to ${direction} actuator for ${durationMs} ms...`);

    this.setMovementDirection(direction);
    this.setCurrentFlow("on");

    await sleep(durationMs);

    this.stop();

    // update current position
    const distance = durationMs * this.props.speed;

    let newPosition = this.currentPosition;
    if (direction === "extend") newPosition += distance;
    else if (direction === "retract") newPosition -= distance;

    this.setPositionValue(newPosition);

    console.log(`Finished ${direction}`);
  }

  public async moveActuatorByDistance(direction: Direction, distance: number) {
    ok(
      distance >= 0 && distance <= this.MAX_MOVEMENT_DISTANCE,
      "Invalid distance"
    );
    if (distance === 0) return;

    const duration = this.toDurationMs(distance);
    await this.moveActuator(direction, duration);
  }

  public async fullyExtend() {
    console.log("Fully extending actuator...");

    const distance = (this.props.strokeLength - this.currentPosition) * factor;

    await this.moveActuatorByDistance("extend", distance);
  }

  public async fullyRetract() {
    console.log("Fully Retracting actuator...");

    const distance = this.currentPosition * factor;

    await this.moveActuatorByDistance("retract", distance);
  }

  public getPosition(): number {
    return this.currentPosition;
  }

  public async setPositionAsync(position: number) {
    ok(position >= 0 && position <= this.props.strokeLength);
    if (position === this.getPosition()) return;

    console.log(`Starting actuator for in ${position}mm height...`);

    const distance = position - this.getPosition();

    if (distance > 0) {
      await this.moveActuatorByDistance("extend", distance);
    } else {
      await this.moveActuatorByDistance("retract", -distance);
    }
  }

  public stop() {
    console.log("Stopping actuator (cutting power)...");
    this.setCurrentFlow("off");
    this.relay.low();
  }

  public async calibrate() {
    console.log("Calibrating actuator...");

    await this.moveActuatorByDistance("retract", this.MAX_MOVEMENT_DISTANCE);
  }

  public cleanup() {
    console.log("Cleaning up GPIOs...");
    this.relay.flush();
    this.mosfet.flush();
  }

  private setCurrentFlow(mode: CurrentFlowMode) {
    if (mode === "on") {
      this.mosfet.high(); // HIGH -> MOSFET ON (current flows)
    } else if (mode === "off") {
      this.mosfet.low(); // LOW -> MOSFET OFF -> No power to actuator
    } else {
      throw new Error("Invalid mode specified");
    }
  }

  private setMovementDirection(direction: Direction) {
    if (direction === "extend") {
      this.relay.low(); // LOW -> Relay OFF -> Normal polarity (+12V)
    } else if (direction === "retract") {
      this.relay.high(); // HIGH -> Relay ON -> Reversed polarity (-12V)
    } else {
      throw new Error("Invalid direction specified");
    }
  }

  private toDurationMs(distance: number) {
    const durationMs = Math.ceil((distance * 1000) / this.props.speed);
    return durationMs;
  }

  private setPositionValue(position: number) {
    this.currentPosition = inBounds(position, 0, this.props.strokeLength);
    console.log(`Position set to ${this.currentPosition}mm height...`);

    if (this.props.onCurrentPositionChange) {
      this.props.onCurrentPositionChange(this.currentPosition);
    }
  }
}
