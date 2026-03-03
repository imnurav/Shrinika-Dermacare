import 'dotenv/config';
import { getTypeOrmDataSourceOptions } from './typeorm.config';
import { DataSource } from 'typeorm';

export default new DataSource(getTypeOrmDataSourceOptions());
