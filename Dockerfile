FROM node:lts-alpine AS frontend-base

FROM frontend-base AS frontend-deps

WORKDIR /app

COPY ./ui/package.json ./ui/package-lock.json* ./

RUN npm ci

FROM frontend-base AS frontend-builder

WORKDIR /app

COPY ./ui .
COPY --from=frontend-deps /app/node_modules ./node_modules

RUN npm run build

# --- Backend build

FROM golang:1.24.1-alpine AS backend-base

FROM backend-base AS backend-builder

WORKDIR /app

COPY . .
COPY --from=frontend-builder /app/dist /app/ui/dist

RUN go build -o /app/gbp .

# --- Final image

FROM alpine:latest

WORKDIR /app

COPY ./backup/seed.db ./seed.db
COPY --from=backend-builder /app/gbp /app/gbp

VOLUME /app/pb_data

EXPOSE 8080
CMD ["/app/gbp", "serve", "--http=0.0.0.0:8080"]
