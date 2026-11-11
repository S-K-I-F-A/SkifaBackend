import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { UserEntity } from '../database/entities.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  UpdateCompanyProfileDto,
  UpdateInternProfileDto,
  ProfileVisibilityDto,
} from './profiles.dto.js';
import { ProfilesService } from './profiles.service.js';

const imageOptions = {
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) =>
    callback(
      file.mimetype.startsWith('image/')
        ? null
        : new BadRequestException('Only image uploads are accepted.'),
      file.mimetype.startsWith('image/'),
    ),
};

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('intern/profile')
  @Roles('intern')
  getIntern(@CurrentUser() user: UserEntity) {
    return this.profiles.getIntern(user.id);
  }

  @Put('intern/profile')
  @Patch('intern/profile')
  @Roles('intern')
  updateIntern(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateInternProfileDto,
  ) {
    return this.profiles.updateIntern(user.id, dto);
  }

  @Put('intern/profile/education')
  @Roles('intern')
  updateEducation(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateInternProfileDto,
  ) {
    return this.profiles.updateIntern(user.id, { education: dto.education });
  }

  @Put('intern/profile/skills')
  @Roles('intern')
  updateSkills(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateInternProfileDto,
  ) {
    return this.profiles.updateIntern(user.id, {
      skills: dto.skills,
      experience: dto.experience,
      availability: dto.availability,
      category: dto.category,
      stipendMin: dto.stipendMin,
      stipendMax: dto.stipendMax,
    });
  }

  @Put('intern/profile/certifications')
  @Roles('intern')
  updateCertifications(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateInternProfileDto,
  ) {
    return this.profiles.updateIntern(user.id, {
      certifications: dto.certifications,
    });
  }

  @Put('intern/profile/work-samples')
  @Roles('intern')
  updateWorkSamples(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateInternProfileDto,
  ) {
    return this.profiles.updateIntern(user.id, {
      workSamples: dto.workSamples,
    });
  }

  @Post('intern/profile/submit')
  @Roles('intern')
  submitIntern(@CurrentUser() user: UserEntity) {
    return this.profiles.submitIntern(user.id);
  }

  @Post('intern/profile/visibility')
  @Roles('intern')
  visibility(
    @CurrentUser() user: UserEntity,
    @Body() dto: ProfileVisibilityDto,
  ) {
    return this.profiles.setVisibility(user, dto.visibility);
  }

  @Post('intern/profile/photos')
  @Roles('intern')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'headshot', maxCount: 1 },
        { name: 'fullBody', maxCount: 1 },
      ],
      imageOptions,
    ),
  )
  saveInternPhotos(
    @CurrentUser() user: UserEntity,
    @UploadedFiles()
    files: {
      headshot?: Express.Multer.File[];
      fullBody?: Express.Multer.File[];
    },
  ) {
    if (!files.headshot?.length && !files.fullBody?.length) {
      throw new BadRequestException('Upload a headshot or full-body photo.');
    }
    return this.profiles.saveInternPhotos(user, files);
  }

  @Get('company/profile')
  @Roles('company')
  getCompany(@CurrentUser() user: UserEntity) {
    return this.profiles.getCompany(user.id);
  }

  @Put('company/profile')
  @Patch('company/profile')
  @Roles('company')
  updateCompany(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateCompanyProfileDto,
  ) {
    return this.profiles.updateCompany(user.id, dto);
  }

  @Post('company/profile/submit')
  @Roles('company')
  submitCompany(@CurrentUser() user: UserEntity) {
    return this.profiles.submitCompany(user.id);
  }

  @Post('company/profile/logo')
  @Roles('company')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', imageOptions))
  saveCompanyLogo(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Upload a company logo.');
    return this.profiles.saveCompanyLogo(user, file);
  }
}
