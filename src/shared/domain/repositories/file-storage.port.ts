export abstract class FileStoragePort {
  abstract upload(folder: string, filename: string, file: Buffer): Promise<{ message: string }>;
  abstract delete(filename: string): Promise<void>;
  abstract getSignedUrl(folder: string, filename: string): Promise<string>;
}
