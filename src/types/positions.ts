export type LEDState = "on" | "off";

export interface Position {
  stroke: number;
  led: LEDState;
}

export interface Positions {
  [key: string]: Position;
}
