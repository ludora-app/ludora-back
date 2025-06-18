import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { FileStoragePort } from 'src/shared/domain/repositories/file-storage.port';

@Injectable()
export class AwsService implements FileStoragePort {
  private readonly s3Client = new S3Client({
    credentials: {
      accessKeyId: this.configService.get('AWS_ACCESS_KEY'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
    },
    region: this.configService.get('AWS_S3_REGION'),
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

      await this.s3Client.send(
        new PutObjectCommand({
          Body: file,
          Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
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
        Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
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
  async delete(filename: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
          Key: filename,
        }),
      );
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw new BadRequestException(error);
    }
  }
}
//todo: trouver la config pour bloquer les fichiers dans le bucket S3
