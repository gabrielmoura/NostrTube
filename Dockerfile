# stage1 as builder
FROM node:20-slim as builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production
ENV VITE_BASE_URL='http://localhost:3001'

WORKDIR /react-ui
RUN corepack enable
# copy the package.json to install dependencies
COPY . .
# Install the dependencies and make the folder
RUN pnpm install && pnpm build

FROM nginx:alpine

#!/bin/sh

COPY .nginx/nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from the stahg 1
COPY --from=builder /dist /usr/share/nginx/html

LABEL org.opencontainers.image.source="https://github.com/gabrielmoura/nostrtube"
LABEL org.opencontainers.image.title="NostrTube"
LABEL org.opencontainers.image.version="0.1.0"
LABEL MANTEINER="Gabriel Moura <gmouradev96@gmail.com>"

EXPOSE 3000 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]