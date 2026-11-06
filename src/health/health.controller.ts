import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check whether the API is running' })
  check() {
    return {
      status: 'ok',
      service: 'skifa-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
