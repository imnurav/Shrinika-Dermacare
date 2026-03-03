import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

const isTrue = (value?: string): boolean => value?.toLowerCase() === 'true';

const buildBaseTypeOrmOptions = (
  databaseUrl: string,
  dbSsl?: string,
  dbSslRejectUnauthorized = 'false',
) => {
  const urlRequiresSsl = databaseUrl.includes('sslmode=require');
  const sanitizedDatabaseUrl = databaseUrl.replace(/[?&]sslmode=require/gi, '').replace(/\?$/, '');

  const useSsl = dbSsl === undefined ? urlRequiresSsl : isTrue(dbSsl);
  const sslConfig = useSsl
    ? {
        rejectUnauthorized: isTrue(dbSslRejectUnauthorized),
      }
    : false;

  return {
    type: 'postgres',
    url: sanitizedDatabaseUrl,
    ssl: sslConfig,
    extra: {
      ssl: sslConfig,
      // Keep pool conservative for managed DB plans with low connection limits.
      max: Number(process.env.DB_POOL_MAX || 5),
      min: Number(process.env.DB_POOL_MIN || 1),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
    },
  };
};

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL') || '';
  const dbSsl = configService.get<string>('DB_SSL');
  const dbSslRejectUnauthorized =
    configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') ?? 'false';

  return {
    ...buildBaseTypeOrmOptions(databaseUrl, dbSsl, dbSslRejectUnauthorized),
    autoLoadEntities: true,
    synchronize: true,
    type: 'postgres',
  };
};

export const getTypeOrmDataSourceOptions = (
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions => {
  const databaseUrl = env.DATABASE_URL || '';

  return {
    ...buildBaseTypeOrmOptions(databaseUrl, env.DB_SSL, env.DB_SSL_REJECT_UNAUTHORIZED ?? 'false'),
    entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
    synchronize: true,
  } as DataSourceOptions;
};
