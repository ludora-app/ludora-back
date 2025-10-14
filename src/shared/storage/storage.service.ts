import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

  /**
   * @description send/update un fichier dans le bucket S3
   * @param folder: dossier dans lequel le fichier sera stocké
   * @param filename: nom du fichier
   * @param file: fichier à envoyer
   */
  async upload(folder: string, filename: string, file: Buffer) {
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

      const response = { message: processedFilename };
      return response;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw new BadRequestException(error);
    }
  }

  /**
   * @description Génère une URL signée pour un fichier dans le bucket S3
   * @param filename
   * @param expiresIn : valeur à laquelle l'URL signée expire (604800 valeur max)
   * @returns
   */
  async getSignedUrl(folder: string, filename: string, expiresIn = 7200): Promise<string> {
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
   * @description Supprime un fichier dans le bucket S3
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
}
