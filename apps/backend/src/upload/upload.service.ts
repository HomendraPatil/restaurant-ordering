import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Client } from 'minio';

interface MulterFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class UploadService implements OnModuleInit {
  private minioClient: Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin';
    const secretKey = this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin';
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'restaurant-images';
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || endpoint;

    const url = new URL(endpoint);
    const useSSL = url.protocol === 'https:';
    const port = url.port ? parseInt(url.port) : (useSSL ? 443 : 9000);
    const endPoint = url.hostname;

    this.minioClient = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async onModuleInit() {
    // Ensure bucket exists
    const bucketExists = await this.minioClient.bucketExists(this.bucket);
    if (!bucketExists) {
      await this.minioClient.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async uploadFile(file: MulterFile, type: 'menu-item' | 'category' = 'menu-item'): Promise<{
    fileUrl: string;
  }> {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = file.originalname.split('.').pop() || 'jpg';
    const prefix = type === 'category' ? 'categories' : 'menu-items';
    const key = `${prefix}/${timestamp}-${randomString}.${extension}`;

    await this.minioClient.putObject(this.bucket, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const fileUrl = `${this.publicUrl}/${this.bucket}/${key}`;

    return { fileUrl };
  }

  async getPresignedUploadUrl(fileName: string, contentType: string, type: 'menu-item' | 'category' = 'menu-item'): Promise<{
    uploadUrl: string;
    fileUrl: string;
  }> {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = fileName.split('.').pop() || 'jpg';
    const prefix = type === 'category' ? 'categories' : 'menu-items';
    const key = `${prefix}/${timestamp}-${randomString}.${extension}`;

    const fileUrl = `${this.publicUrl}/${this.bucket}/${key}`;
    const uploadUrl = await this.minioClient.presignedPutObject(this.bucket, key, 3600);

    return {
      uploadUrl,
      fileUrl,
    };
  }
}
