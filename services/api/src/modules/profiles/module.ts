import { Controller, Get, Injectable, Module, Req, UseGuards } from '@nestjs/common';
import { TelemetryIdentity, TelemetryRequest } from '../../../telemetry/src/auth';
import { TelemetryDatabase as Database } from '../../../telemetry/src/database';
import { TelemetryError as ApiError } from '../../../telemetry/src/errors';
@Injectable()
export class Profiles {
  constructor(private readonly db: Database) {}
  async get(owner: string,roles: ('user'|'admin')[]) {
    const row = (await this.db.query('SELECT id,time_zone,status FROM profiles WHERE id=$1',[owner])).rows[0];
    if (row?.status !== 'active') throw new ApiError(403,'PROFILE_NOT_ACTIVE');
    return {id:row.id,timeZone:row.time_zone,roles,status:row.status};
  }
}
@Controller('me')
@UseGuards(TelemetryIdentity)
class ProfilesController {
  constructor(private readonly profiles: Profiles) {}
  @Get() profile(@Req() req: TelemetryRequest) { return this.profiles.get(req.telemetryOwner,req.coreRoles); }
}
@Module({controllers:[ProfilesController],providers:[Profiles]})
export class ProfilesModule {}
