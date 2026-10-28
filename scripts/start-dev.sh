#!/bin/sh
set -e

# Apply DB migrations
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -once -- node_modules/.bin/prisma migrate deploy

# Seed admin accounts
/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/prisma/seeds/admin-seed.js

/usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/prisma/seeds/local-seed.js

# Start the application
exec /usr/local/bin/vault-auth.sh envconsul -config=/etc/envconsul/config.hcl -- node dist/src/main.js
