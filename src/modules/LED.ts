import { CleanableResource } from "../types/CleanableResource";
import { LEDState } from "../types/positions";
import { GPIO_Component } from "./GPIO_Component";

export interface LedProps {
  readonly mosfetPin: number;
  readonly initialState: LEDState;
  readonly onCurrentStateChange?: (state: LEDState) => Promise<unknown>;
}

export class LED implements CleanableResource {
  private readonly props: LedProps;
  private mosfet: GPIO_Component;
  private currentState: LEDState;

  constructor(props: LedProps) {
    this.props = props;

    const initialMosfetMode = props.initialState === "on" ? "Low" : "High";

    this.mosfet = new GPIO_Component(props.mosfetPin, initialMosfetMode);
    this.currentState = props.initialState;
  }

  public on(): void {
    if (this.isOn()) return;

    console.log("Turning LED on...");
    // MOSFET is active low, so we set it to LOW to turn the LED on
    this.mosfet.low();
    this.currentState = "on";
    this.props.onCurrentStateChange?.("on");
  }

  public off(): void {
    if (!this.isOn()) return;

    console.log("Turning LED off...");
    // MOSFET is active low, so we set it to HIGH to turn the LED off
    this.mosfet.high();
    this.currentState = "off";
    this.props.onCurrentStateChange?.("off");
  }

  public toggle(): void {
    if (this.isOn()) {
      this.off();
    } else {
      this.on();
    }
  }

  public setState(state: LEDState): void {
    if (state === "on") {
      this.on();
    } else {
      this.off();
    }
  }

  public getState(): LEDState {
    return this.currentState;
  }

  private isOn(): boolean {
    return this.currentState === "on";
  }

  public calibrate(): void {
    console.log("Calibrating LED...");
    this.off();
  }

  public async cleanup(): Promise<void> {
    console.log("Cleaning up LED GPIO...");
    // this.off(); // Do not turn off the LED, otherwise the LED will turn off
    this.mosfet.cleanup();
  }
}
