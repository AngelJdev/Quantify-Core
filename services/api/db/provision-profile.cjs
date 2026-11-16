const { Pool } = require('pg');
const { configuration } = require('../build/src/platform/config');
const { isValidIanaTimeZone } = require('../build/src/modules/checkins/domain/businessDate');
(async () => {
  const config = configuration();
  const subject = process.env.PROFILE_SUBJECT;
  const zone = process.env.PROFILE_TIME_ZONE;
  if (!subject || subject.length > 255 || !zone || !isValidIanaTimeZone(zone)) throw new Error('Invalid profile mapping');
  const pool = new Pool({ connectionString: config.databaseUrl, connectionTimeoutMillis: 3000 });
  try {
    // Map an existing IdP subject. Never create credentials or reactivate a suspended profile.
    await pool.query(`INSERT INTO profiles(oidc_issuer,oidc_subject,time_zone) VALUES($1,$2,$3)
      ON CONFLICT(oidc_issuer,oidc_subject) DO NOTHING`,[config.issuer,subject,zone]);
    console.log('OIDC profile mapping available; existing status and preferences preserved.');
  } finally { await pool.end(); }
})().catch(() => { console.error('Profile mapping failed; check local configuration.'); process.exitCode = 1; });
