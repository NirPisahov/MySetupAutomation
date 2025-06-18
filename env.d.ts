declare namespace NodeJS {
  interface ProcessEnv {
    readonly CACHE_FILE_NAME: string;
    readonly MOTOR_DRIVER_PIN1: string;
    readonly MOTOR_DRIVER_PIN2: string;
    readonly LED_MOSFET_PIN: string;
  }
}
