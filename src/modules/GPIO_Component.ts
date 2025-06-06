import { Gpio } from "onoff";
// cat /sys/kernel/debug/gpio
export class GPIO_Component {
  protected pin: Gpio;

  constructor(pinNum: number) {
    this.pin = new Gpio(pinNum, "out");
  }

  high() {
    this.pin.writeSync(1);
  }

  low() {
    this.pin.writeSync(0);
  }

  flush() {
    this.low();
    this.pin.unexport();
  }
}
