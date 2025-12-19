#!/bin/sh
set -e

# ============================================
# 1. Authentification Vault AppRole
# ============================================
# Source le script pour exporter VAULT_TOKEN
. /usr/local/bin/vault-auth.sh

# ============================================
# 2. Generate Prisma client
# ============================================
echo "📦 Generating Prisma client..."
pnpm prisma generate

# ============================================
# 3. Run migrations with Vault secrets
# ============================================
echo "🗄️ Running database migrations..."
envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma migrate deploy

# ============================================
# 4. Push schema changes
# ============================================
echo "🗄️ Pushing schema changes..."
envconsul -config=/etc/envconsul/config.hcl -once -- pnpm exec prisma db push

# ============================================
# 5. Seed the database
# ============================================
echo "🌱 Seeding database..."
envconsul -config=/etc/envconsul/config.hcl -once -- pnpm run seed

# ============================================
# 6. Start the app (watch mode for dev)
# ============================================
echo "🚀 Starting NestJS app..."
exec envconsul -config=/etc/envconsul/config.hcl -- pnpm exec nest start --watch --preserveWatchOutput
