import { Module, Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards, BadRequestException, ConflictException, NotFoundException, Headers, ParseUUIDPipe, PreconditionRequiredException, PreconditionFailedException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { Db } from './db';
import { AuthGuard } from './auth';
import { CategoryDto, CategoryPatchDto, HabitDto, HabitPatchDto, validateZone } from './dto';
const actor=(r:Request)=>{if (!r.actor) throw new Error('Actor no resuelto');return r.actor.id};
const version=(raw:string|undefined)=>{
  if (!raw) throw new PreconditionRequiredException('If-Match requerido');
  const value=/^"?([1-9]\d*)"?$/.exec(raw)?.[1];
  if (!value) throw new BadRequestException('If-Match debe contener la versión');
  return Number(value);
};
const iso=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date+'T00:00:00Z'));
const mapCategory=(r:any)=>({id:r.id,name:r.name,description:r.description,version:r.version,createdAt:r.created_at,updatedAt:r.updated_at});
const mapHabit=(r:any)=>({id:r.id,categoryId:r.category_id,name:r.name,targetValue:Number(r.target_value),unit:r.unit,
 schedule:{weekdays:r.weekdays,effectiveFrom:(typeof r.effective_from==='string'?r.effective_from:r.effective_from.toISOString().slice(0,10))},
 timeZone:r.time_zone,status:r.status,version:r.version,createdAt:r.created_at,updatedAt:r.updated_at});
@Injectable()
class CoreService {
 constructor(private readonly db:Db){}
 async listCategories(owner:string){
   const q=await this.db.query('SELECT * FROM categories WHERE owner_id=$1 AND archived_at IS NULL ORDER BY created_at,id',[owner]);
   return {items:q.rows.map(mapCategory)};
 }
 async createCategory(owner:string,d:CategoryDto) {
  try {return await this.db.transaction(async c=>{
    const q=await c.query('INSERT INTO categories(owner_id,name,description) VALUES ($1,$2,$3) RETURNING *',[owner,d.name.trim(),d.description??null]);
    return mapCategory(q.rows[0]);
  });} catch(e:any){if(e.code==='23505')throw new ConflictException('Categoría duplicada');throw e;}
 }
 async category(owner:string,id:string) {
   const q=await this.db.query('SELECT * FROM categories WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL',[id,owner]);
   if (!q.rowCount) throw new NotFoundException();return mapCategory(q.rows[0]);
 }
 async updateCategory(owner:string,id:string,d:CategoryPatchDto,ver:number){
   if (!Object.keys(d).length) throw new BadRequestException('Envíe al menos un campo');
   try {
    const q=await this.db.query(\`UPDATE categories SET name=COALESCE($4,name),description=COALESCE($5,description),version=version+1,updated_at=now()
      WHERE id=$1 AND owner_id=$2 AND archived_at IS NULL AND version=$3 RETURNING *\`,[id,owner,ver,d.name?.trim()??null,d.description??null]);
    if(!q.rowCount){await this.category(owner,id);throw new PreconditionFailedException('Versión obsoleta');}
    return mapCategory(q.rows[0]);
   }catch(e:any){if(e.code==='23505')throw new ConflictException('Categoría duplicada');throw e;}
 }
 async archiveCategory(owner:string,id:string,ver:number){
   const q=await this.db.query(\`UPDATE categories SET archived_at=now(),version=version+1,updated_at=now()
    WHERE id=$1 AND owner_id=$2 AND version=$3 AND archived_at IS NULL RETURNING *\`,[id,owner,ver]);
   if(!q.rowCount){await this.category(owner,id);throw new PreconditionFailedException();}
   return {id:q.rows[0].id,archived:true};
 }
 async listHabits(owner:string){
  const q=await this.db.query('SELECT * FROM habits WHERE owner_id=$1 ORDER BY created_at,id',[owner]);
  return {items:q.rows.map(mapHabit),nextCursor:null};
 }
 async habit(owner:string,id:string){
  const q=await this.db.query('SELECT * FROM habits WHERE owner_id=$1 AND id=$2',[owner,id]);
  if(!q.rowCount)throw new NotFoundException();return mapHabit(q.rows[0]);
 }
 async createHabit(owner:string,d:HabitDto){
  if (!validateZone(d.timeZone)||!iso(d.schedule.effectiveFrom))throw new BadRequestException('Zona IANA o fecha inválida');
  const q=await this.db.query(\`INSERT INTO habits(owner_id,category_id,name,target_value,unit,weekdays,effective_from,time_zone)
   SELECT $1,$2,$3,$4,$5,$6,$7,$8
   WHERE $2::uuid IS NULL OR EXISTS (SELECT 1 FROM categories WHERE id=$2 AND owner_id=$1 AND archived_at IS NULL)
   RETURNING *\`,[owner,d.categoryId??null,d.name.trim(),d.targetValue,d.unit.trim(),d.schedule.weekdays,d.schedule.effectiveFrom,d.timeZone]);
  if(!q.rowCount)throw new NotFoundException('Categoría no disponible');
  return mapHabit(q.rows[0]);
 }
 async updateHabit(owner:string,id:string,d:HabitPatchDto,ver:number){
   if (!Object.keys(d).length) throw new BadRequestException('Envíe al menos un campo');
   if (d.timeZone!==undefined&&!validateZone(d.timeZone))throw new BadRequestException('Zona inválida');
   if (d.schedule && !iso(d.schedule.effectiveFrom))throw new BadRequestException('Fecha inválida');
   const prior=await this.habit(owner,id);
   if (prior.status==='archived') throw new ConflictException('Hábito archivado: historial conservado');
   if (d.status==='active' && prior.status==='archived')throw new ConflictException('No restaurar hábitos archivados');
   if(d.categoryId){
     await this.category(owner,d.categoryId);
   }
   const q=await this.db.query(\`UPDATE habits SET
    name=COALESCE($4,name),target_value=COALESCE($5,target_value),unit=COALESCE($6,unit),
    weekdays=COALESCE($7,weekdays),effective_from=COALESCE($8,effective_from),
    time_zone=COALESCE($9,time_zone),status=COALESCE($10,status),
    category_id=COALESCE($11,category_id),version=version+1,updated_at=now()
    WHERE id=$1 AND owner_id=$2 AND version=$3 AND status<>'archived' RETURNING *\`,
    [id,owner,ver,d.name?.trim()??null,d.targetValue??null,d.unit?.trim()??null,d.schedule?.weekdays??null,
     d.schedule?.effectiveFrom??null,d.timeZone??null,d.status??null,d.categoryId??null]);
   if(!q.rowCount)throw new PreconditionFailedException('Versión obsoleta');
   return mapHabit(q.rows[0]);
 }
}
@Controller()
@UseGuards(AuthGuard)
class CoreController {
 constructor(private readonly core:CoreService){}
 @Get('categories') listCategories(@Req()r:Request){return this.core.listCategories(actor(r));}
 @Post('categories') createCategory(@Req()r:Request,@Body()d:CategoryDto){return this.core.createCategory(actor(r),d);}
 @Get('categories/:id') getCategory(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.core.category(actor(r),id);}
 @Patch('categories/:id') patchCategory(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string,@Headers('if-match')v:string,@Body()d:CategoryPatchDto){return this.core.updateCategory(actor(r),id,d,version(v));}
 @Delete('categories/:id') archiveCategory(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string,@Headers('if-match')v:string){return this.core.archiveCategory(actor(r),id,version(v));}
 @Get('habits') listHabits(@Req()r:Request){return this.core.listHabits(actor(r));}
 @Post('habits') createHabit(@Req()r:Request,@Body()d:HabitDto){return this.core.createHabit(actor(r),d);}
 @Get('habits/:id') getHabit(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.core.habit(actor(r),id);}
 @Patch('habits/:id') patchHabit(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string,@Headers('if-match')v:string,@Body()d:HabitPatchDto){return this.core.updateHabit(actor(r),id,d,version(v));}
 @Delete('habits/:id') archiveHabit(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string,@Headers('if-match')v:string){return this.core.updateHabit(actor(r),id,{status:'archived'},version(v));}
}
@Module({controllers:[CoreController],providers:[Db,AuthGuard,CoreService]})
export class AppModule{}
