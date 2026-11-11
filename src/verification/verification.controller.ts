import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { UserEntity } from '../database/entities.js';
import {
  ReviewVerificationDto,
  SubmitVerificationDto,
} from './verification.dto.js';
import { VerificationService } from './verification.service.js';

const documentTypes = ['image/jpeg', 'image/png', 'application/pdf'];

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get(['verification', 'intern/verification'])
  @Roles('intern')
  getStatus(@CurrentUser() user: UserEntity) {
    return this.verification.latest(user.id);
  }

  @Post([
    'verification/identity',
    'intern/verification',
    'intern/verification/:id/resubmit',
  ])
  @Roles('intern')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'front', maxCount: 1 },
        { name: 'back', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
          const accepted =
            file.fieldname === 'selfie'
              ? file.mimetype.startsWith('image/')
              : documentTypes.includes(file.mimetype);
          callback(
            accepted
              ? null
              : new BadRequestException('Use JPG, PNG or PDF documents.'),
            accepted,
          );
        },
      },
    ),
  )
  submit(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string | undefined,
    @Body() dto: SubmitVerificationDto,
    @UploadedFiles()
    files: {
      front?: Express.Multer.File[];
      back?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    return this.verification.submit(user, dto, files, id);
  }

  @Get('admin/verifications')
  @Roles('admin')
  listPending() {
    return this.verification.listPending();
  }

  @Patch('admin/verifications/:id')
  @Roles('admin')
  review(@Param('id') id: string, @Body() dto: ReviewVerificationDto) {
    return this.verification.review(id, dto);
  }

  @Post('admin/verifications/:id/decision')
  @Roles('admin')
  decision(@Param('id') id: string, @Body() dto: ReviewVerificationDto) {
    return this.verification.review(id, dto);
  }
}
