import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
@Injectable()
export class Db implements OnModuleDestroy {
  private readonly pool:Pool;
  constructor() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no configurado');
    this.pool = new Pool({connectionString:process.env.DATABASE_URL});
  }
  query<T extends import('pg').QueryResultRow = any>(sql:string,values:unknown[]=[]){return this.pool.query<T>(sql,values);}
  async transaction<T>(fn:(c:PoolClient)=>Promise<T>):Promise<T> {
    const client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result=await fn(client);
      await client.query('COMMIT');
      return result;
    } catch(e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {client.release();}
  }
  async onModuleDestroy(){await this.pool.end();}
}
