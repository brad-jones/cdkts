export interface Downloader {
  getBinaryPath(version?: string): Promise<string>;
}
