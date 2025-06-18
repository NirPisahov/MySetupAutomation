declare namespace NodeJS {
  interface ProcessEnv {
    // Cache files
    readonly CACHE_FILE_NAME: string;

    // Config files
    readonly POSITIONS_FILE_NAME: string;

    // Raspberry Pi
    readonly PI_HOSTNAME: string;
    readonly PI_USERNAME: string;
    readonly PI_DEFAULT_IP: string;

    // Actuator
    readonly MOTOR_DRIVER_PIN1: string;
    readonly MOTOR_DRIVER_PIN2: string;

    // LED Strip
    readonly LED_MOSFET_PIN: string;
  }
}
