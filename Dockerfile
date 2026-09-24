# The frontend output is architecture independent and the go binary cross
# compiles (the sqlite driver is pure go), so every build stage runs natively on
# the build host and only the final image is per target platform.

# --- Frontend build

FROM --platform=$BUILDPLATFORM node:lts-alpine AS frontend-deps

WORKDIR /app

COPY ./ui/package.json ./ui/package-lock.json* ./

RUN npm ci

FROM --platform=$BUILDPLATFORM node:lts-alpine AS frontend-builder

WORKDIR /app

COPY ./ui .
COPY --from=frontend-deps /app/node_modules ./node_modules

RUN npm run build

# --- Backend build

FROM --platform=$BUILDPLATFORM golang:1.27-alpine AS backend-base

WORKDIR /app

COPY go.mod go.sum ./

RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .
COPY --from=frontend-builder /app/dist /app/ui/dist

FROM backend-base AS backend-builder

ARG TARGETOS
ARG TARGETARCH

RUN --mount=type=cache,target=/go/pkg/mod \
	--mount=type=cache,target=/root/.cache/go-build \
	CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o /out/gbp ./cmd/gbp

# --- Backend seed
#
# Hashing needs a runnable binary, so this stage builds one for the build host
# rather than reusing the cross compiled artifact. The stage is architecture
# independent, so it is built once and shared by every target platform.

FROM backend-base AS backend-seed-builder

RUN --mount=type=cache,target=/go/pkg/mod \
	--mount=type=cache,target=/root/.cache/go-build \
	CGO_ENABLED=0 go build -o /usr/local/bin/gbp ./cmd/gbp

COPY ./backup/seed.db ./backup/seed.note /seed/

RUN gbp hash /seed/seed.db /seed/seed.hash

# --- Final image

FROM alpine:latest

WORKDIR /app

COPY --from=backend-seed-builder /seed/seed.db /seed/seed.hash /seed/seed.note /app/
COPY --from=backend-builder      /out/gbp                                      /app/gbp

VOLUME /app/pb_data

EXPOSE 8080
CMD ["/app/gbp", "serve", "--http=0.0.0.0:8080"]
