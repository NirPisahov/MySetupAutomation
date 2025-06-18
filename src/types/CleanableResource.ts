export interface CleanableResource {
  cleanup(): Promise<void>;
}
