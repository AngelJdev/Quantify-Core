import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class CategoryDto {
  @IsString() @Length(3,60) name!:string;
  @IsOptional() @IsString() @Length(0,240) description?:string;
}
export class CategoryPatchDto {
  @IsOptional() @IsString() @Length(3,60) name?:string;
  @IsOptional() @IsString() @Length(0,240) description?:string;
}
export class ScheduleDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(7) @ArrayUnique()
  @IsInt({each:true}) @Min(1,{each:true}) @Max(7,{each:true}) weekdays!:number[];
  @IsDateString({strict:true}) effectiveFrom!:string;
}
export class HabitDto {
  @IsString() @Length(3,60) name!:string;
  @IsNumber({maxDecimalPlaces:3}) @Min(0.001) targetValue!:number;
  @IsString() @Length(1,40) unit!:string;
  @ValidateNested() @Type(()=>ScheduleDto) schedule!:ScheduleDto;
  @IsString() timeZone!:string;
  @IsOptional() @IsUUID() categoryId?:string;
}
export class HabitPatchDto {
  @IsOptional() @IsString() @Length(3,60) name?:string;
  @IsOptional() @IsNumber({maxDecimalPlaces:3}) @Min(0.001) targetValue?:number;
  @IsOptional() @IsString() @Length(1,40) unit?:string;
  @IsOptional() @ValidateNested() @Type(()=>ScheduleDto) schedule?:ScheduleDto;
  @IsOptional() @IsString() timeZone?:string;
  @IsOptional() @IsUUID() categoryId?:string;
  @IsOptional() @IsEnum(['active','paused','archived']) status?:'active'|'paused'|'archived';
}
export function validateZone(zone:string) {
  if (!zone || zone.length>80) return false;
  try { new Intl.DateTimeFormat('en',{timeZone:zone}); return true; } catch { return false; }
}
