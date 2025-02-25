FROM postgres:17

# Installation des dépendances nécessaires
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    wget \
    gnupg2 \
    lsb-release && \
    # Ajouter la clé GPG et le repo de Doppler
    curl -sLf --retry 3 --tlsv1.2 --proto "=https" 'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
    # Ajouter le repo PostgreSQL
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    # Installer Doppler et PostgreSQL avec PostGIS
    apt-get install -y \
        doppler \
        postgis \
        postgresql-17-postgis-3 \
        postgresql-17-postgis-3-scripts && \
    # Nettoyer les fichiers inutiles pour réduire la taille de l'image
    rm -rf /var/lib/apt/lists/*


# Copie du script SQL d'initialisation
COPY ./docker/postgres/enable-postgis.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

CMD ["doppler", "run", "--", "docker-entrypoint.sh", "postgres"]
