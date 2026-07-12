#!/usr/bin/env bash
set -euo pipefail

# Publica no Docker Hub como <DOCKERHUB_USER>/backoffice-krefasy:<TAG>
# Uso:
#   export DOCKERHUB_USER=oteuutilizador   # ou nome da organização
#   export TAG=latest                     # opcional, default: latest
#   docker login                          # uma vez por máquina
#   bash scripts/docker-push-hub.sh

: "${DOCKERHUB_USER:?Defina DOCKERHUB_USER (utilizador ou org no Docker Hub, ex.: minhaempresa)}"

TAG="${TAG:-latest}"
IMAGE_LOCAL="backoffice-krefasy:${TAG}"
IMAGE_REMOTE="${DOCKERHUB_USER}/backoffice-krefasy:${TAG}"

echo "Building ${IMAGE_LOCAL}..."
docker build -t "${IMAGE_LOCAL}" .

echo "Tagging ${IMAGE_REMOTE}..."
docker tag "${IMAGE_LOCAL}" "${IMAGE_REMOTE}"

echo "Pushing ${IMAGE_REMOTE}..."
docker push "${IMAGE_REMOTE}"

echo "Feito. Imagem: docker pull ${IMAGE_REMOTE}"
