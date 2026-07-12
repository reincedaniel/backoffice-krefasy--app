# syntax=docker/dockerfile:1
#
# Imagem local sugerida: backoffice-krefasy:latest
#
# Publicar no Docker Hub (substitui TEU_USER pelo teu utilizador ou organização):
#   docker login
#   docker build -t backoffice-krefasy:latest .
#   docker tag backoffice-krefasy:latest TEU_USER/backoffice-krefasy:latest
#   docker push TEU_USER/backoffice-krefasy:latest
#
# Ou: DOCKERHUB_USER=TEU_USER bash scripts/docker-push-hub.sh

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    listen [::]:80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
