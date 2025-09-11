import dotenv from 'dotenv';

dotenv.config({ path: ".env", quiet: true });

import sql from 'mssql';

let pool_NewFCXT: sql.ConnectionPool | null = null;
let pool_DASHBOARD: sql.ConnectionPool | null = null;

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`❌ Missing env: ${name}`);
  return value;
};

export const getDashboardConnection = async () => {
  if (pool_NewFCXT) return pool_NewFCXT;

  pool_NewFCXT = await new sql.ConnectionPool({
    user: requiredEnv('MSSQL_USER'),
    password: requiredEnv('MSSQL_PASSWORD'),
    server: 'localhost',
    database: requiredEnv('MSSQL_DATABASE'),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  }).connect();

  // console.log('✅ Connected to NewFCXT DB');
  return pool_NewFCXT;
};

export const getDemo1Connection = async () => {
  if (pool_DASHBOARD) return pool_DASHBOARD;

  pool_DASHBOARD = await new sql.ConnectionPool({
    user: requiredEnv('MSSQL_USER'),
    password: requiredEnv('MSSQL_PASSWORD'),
    server: 'localhost',
    database: requiredEnv('MSSQL_DATABASE'),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  }).connect();

  // console.log('✅ Connected to DASHBOARD DB');
  return pool_DASHBOARD;
};