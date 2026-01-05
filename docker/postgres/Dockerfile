FROM postgres:17

# Installation des dépendances nécessaires
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    wget \
    gnupg2 \
    lsb-release \
    unzip && \
    # Install envconsul pour Vault
    curl -L https://releases.hashicorp.com/envconsul/0.13.1/envconsul_0.13.1_linux_amd64.zip -o /tmp/envconsul.zip && \
    unzip /tmp/envconsul.zip -d /usr/local/bin && \
    rm /tmp/envconsul.zip && \
    chmod +x /usr/local/bin/envconsul && \
    # Ajouter le repo PostgreSQL
    sh -c 'echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg && \
    apt-get update && \
    # Installer PostgreSQL avec PostGIS
    apt-get install -y \
        postgis \
        postgresql-17-postgis-3 \
        postgresql-17-postgis-3-scripts && \
    # Nettoyer les fichiers inutiles pour réduire la taille de l'image
    rm -rf /var/lib/apt/lists/*

# Créer le répertoire pour la config envconsul
RUN mkdir -p /etc/envconsul

# Copie des scripts SQL d'initialisation
COPY ./docker/postgres/enable-extentions.sql /docker-entrypoint-initdb.d/

# Copie des scripts vault-auth et start-postgres
COPY ./scripts/vault/vault-auth.sh /usr/local/bin/vault-auth.sh
COPY ./scripts/start-postgres.sh /usr/local/bin/start-postgres.sh
RUN chmod +x /usr/local/bin/vault-auth.sh /usr/local/bin/start-postgres.sh

EXPOSE 5432

# Script d'entrée : auth AppRole puis envconsul puis postgres
CMD ["start-postgres.sh"]
