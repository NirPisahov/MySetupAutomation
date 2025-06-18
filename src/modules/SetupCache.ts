import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { LEDState } from "../types/positions";

export type CacheData = {
  actuatorPosition: number;
  ledState: LEDState;
};

const DEFAULT_CACHE_DATA: CacheData = {
  actuatorPosition: 0,
  ledState: "off",
};

export class SetupCache {
  private readonly cacheFilePath: string;
  private data: CacheData;
  private loaded: boolean;

  constructor(cacheFilePath: string) {
    this.cacheFilePath = path.resolve(cacheFilePath);
    this.data = { ...DEFAULT_CACHE_DATA };
    this.loaded = false;
  }

  async load(): Promise<void> {
    try {
      if (!(await this.cacheFileExists())) {
        await this.save();
      }

      const data = await fs.readFile(this.cacheFilePath, "utf-8");
      const json = JSON.parse(data) as CacheData;

      this.data = { ...DEFAULT_CACHE_DATA, ...json };
      this.loaded = true;

      console.log(`Loaded cache data: ${this.dataToString()}`);
    } catch (err) {
      console.error("Failed to load cache:", err);
      throw new Error("Failed to load cache data");
    }
  }

  async update(data: Partial<CacheData>): Promise<void> {
    if (!this.loaded) {
      await this.load();
    }

    this.data = { ...this.data, ...data };
    await this.save();
  }

  async getData(): Promise<CacheData> {
    if (!this.loaded) {
      await this.load();
    }
    return { ...this.data };
  }

  private async save(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.cacheFilePath), { recursive: true });
      await fs.writeFile(this.cacheFilePath, this.dataToString());
      console.log(`Updated cache file: ${this.dataToString()}`);
    } catch (err) {
      console.error("Failed to save cache:", err);
      throw new Error("Failed to save cache data");
    }
  }

  private dataToString(): string {
    return JSON.stringify(this.data, null, 2);
  }

  private async cacheFileExists(): Promise<boolean> {
    try {
      await fs.access(this.cacheFilePath);
      return true;
    } catch {
      return false;
    }
  }
}
