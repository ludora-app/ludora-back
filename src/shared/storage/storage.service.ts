import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import { StorageFolderName } from '../constants/constants';
@Injectable()
export class StorageService {
  private readonly s3 = new S3({
    credentials: {
      accessKeyId: this.configService.get('CLOUDFLARE_R2_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('CLOUDFLARE_R2_SECRET_KEY'),
    },
    endpoint: this.configService.get('CLOUDFLARE_R2_API'),
    region: 'auto',
  });

  constructor(private readonly configService: ConfigService) {}
  private readonly publicUrl = this.configService.getOrThrow('CLOUDFLARE_R2_PUBLIC_URL');

  /**
   * @description send/update a file to the S3 bucket
   * @param folder: folder in which the file will be stored
   * @param filename: file name
   * @param file: file to send
   * @returns { data: string }
   */
  async upload(folder: string, filename: string, file: Buffer): Promise<{ data: string }> {
    try {
      const processedFilename = Date.now() + filename;

      const key = `${folder}/${processedFilename}`;

      await this.s3.send(
        new PutObjectCommand({
          Body: file,
          Bucket: this.configService.getOrThrow('CLOUDFLARE_R2_BUCKET'),
          Key: key,
        }),
      );

      const response = { data: `${this.publicUrl}/${key}` };
      return response;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw new BadRequestException(error);
    }
  }

  /**
   * @deprecated Use getUnsignedUrl instead
   * @description Generates a signed URL for a file in the S3 bucket
   * @param filename
   * @param expiresIn : value at which the signed URL expires (604800 max value)
   * @returns { string }
   */
  async getSignedUrl(folder: string, filename: string, expiresIn = 7200): Promise<string> {
    if (!filename) {
      return '';
    }

    try {
      const key = `${folder}/${filename}`;

      const command = new GetObjectCommand({
        Bucket: this.configService.getOrThrow('CLOUDFLARE_R2_BUCKET'),
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /**
   * @description Deletes a file from the S3 bucket
   * @param filename
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.configService.getOrThrow('CLOUDFLARE_R2_BUCKET'),
          Key: filename,
        }),
      );
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw new BadRequestException(error);
    }
  }

  /**
   * @description Picks a random default profile picture from the default-avatars folder
   * @returns { data: string }
   */
  async createDefaultProfilePicture(): Promise<{ data: string }> {
    const randomNumber = Math.floor(Math.random() * 16) + 1;
    const fileName = `${this.publicUrl}/${StorageFolderName.USERS}/default-avatars/ludo-${randomNumber}.png`;

    return { data: fileName };
  }
}
