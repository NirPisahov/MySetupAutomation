import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

type CacheData = {
  actuatorPosition: number;
};

const INIT_CACHE_DATA: CacheData = {
  actuatorPosition: 0,
};

export class SetupCache {
  cacheFilePath: string;
  data: CacheData;
  loaded: boolean;

  constructor(relativeCacheFilePath: string) {
    // this.cacheFilePath = path.join(__dirname, relativeCacheFilePath);
    this.cacheFilePath = "/home/nirpisahov/actuator-control/production.json";
    this.data = INIT_CACHE_DATA;
    this.loaded = false;
  }

  async load() {
    try {
      if (!(await this.cacheFileExists())) {
        await fs.appendFile(this.cacheFilePath, this.dataToString());
      }

      const data = await fs.readFile(this.cacheFilePath, "utf-8");
      const json = JSON.parse(data) as CacheData;

      this.data = json;
      this.loaded = true;

      console.log(`Loaded cache data: ${this.dataToString()}`);
    } catch (err) {
      console.warn(err);
      console.warn("Cache file not found or invalid.");
    }
  }

  async update(data: Partial<CacheData>) {
    if (!this.loaded) {
      await this.load();
    }

    await fs.writeFile(
      this.cacheFilePath,
      JSON.stringify({ ...this.data, data }, null, 2)
    );

    console.log(`Updated cache file: ${this.dataToString()}`);
  }

  private dataToString() {
    return JSON.stringify(this.data, null, 2);
  }

  private async cacheFileExists() {
    try {
      await fs.access(this.cacheFilePath);
      return true;
    } catch {
      return false;
    }
  }
}
