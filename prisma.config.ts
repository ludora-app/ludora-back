import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  datasource: {
    url: 'postgresql://ludora_user:root@ludora-db:5432/ludora',
  },
});
