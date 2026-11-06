import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { InternProfileEntity, UserEntity } from '../database/entities.js';
import { StorageService } from '../storage/storage.service.js';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('video-cv')
export class MediaController {
  constructor(
    @InjectRepository(InternProfileEntity)
    private readonly profiles: Repository<InternProfileEntity>,
    private readonly storage: StorageService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const accepted = [
          'video/webm',
          'video/mp4',
          'video/quicktime',
        ].includes(file.mimetype);
        callback(
          accepted
            ? null
            : new BadRequestException('Use WebM, MP4 or MOV video.'),
          accepted,
        );
      },
    }),
  )
  async upload(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (user.role !== 'intern') {
      throw new ForbiddenException(
        'Only intern accounts can upload a video CV.',
      );
    }
    if (!user.pro)
      throw new ForbiddenException('Video CV requires Pro access.');
    if (!file) throw new BadRequestException('Upload a video file.');
    const profile = await this.profiles.findOneByOrFail({ userId: user.id });
    profile.videoCvPath = await this.storage.savePrivate(
      user.id,
      'video-cv',
      file,
    );
    await this.profiles.save(profile);
    return { saved: true };
  }
}
