declare namespace NodeJS {
  interface ProcessEnv {
    readonly CACHE_FILE_NAME: string;
    readonly SMALL_LINEAR_ACTUATOR_RELAY_PIN: string;
    readonly SMALL_LINEAR_ACTUATOR_MOSFET_PIN: string;
  }
}
