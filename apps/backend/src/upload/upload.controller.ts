import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

class GetPresignedUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsString()
  type: 'menu-item' | 'category';
}

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for file upload' })
  async getPresignedUrl(@Body() dto: GetPresignedUrlDto) {
    return this.uploadService.getPresignedUploadUrl(dto.fileName, dto.contentType, dto.type);
  }

  @Post('direct')
  @ApiOperation({ summary: 'Upload file directly to storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'menu-item' | 'category' = 'menu-item',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadFile(file, type);
  }
}
