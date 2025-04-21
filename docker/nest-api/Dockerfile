FROM node:22.13.1-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    procps && \
    curl --proto "=https" -sLf --retry 3 --tlsv1.2 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | \
    gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | \
    tee /etc/apt/sources.list.d/doppler-cli.list && \
    apt-get update && \
    apt --no-install-recommends install -y build-essential doppler && \
    rm -rf /var/lib/apt/lists/*  

RUN npm i -g pnpm && npm uninstall -g npm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install 

COPY . ./

RUN pnpm dlx prisma generate

EXPOSE 2424

CMD ["doppler", "run", "--", "pnpm", "run", "start:dev"]
