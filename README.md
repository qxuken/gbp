# Genshin Build Planner

## Screenshots

| Light Mode                                | Dark Mode                               |
| ----------------------------------------- | --------------------------------------- |
| ![Light Mode](screenshots/light-mode.png) | ![Dark Mode](screenshots/dark-mode.png) |

## Description

A web application for planning and managing Genshin Impact character builds, weapon builds, artifact sets, and team compositions. The application features a Go backend powered by PocketBase and a modern React/TypeScript frontend.

## Tech Stack

* **Backend:** Go with PocketBase framework
* **Frontend:** TypeScript, React, Vite
* **Database:** SQLite (via PocketBase)
* **Containerization:** Docker
* **Scripting:** Nushell

## Project Structure

The project is organized into two main parts:

### Backend (`/`)

* `main.go` - Main application entry point
* `internals/` - Core backend logic and models
* `migrations/` - SQLite database migration files
* `Dockerfile` - Container configuration
* `publish.nu` - Docker image build and publish script
* `build.nu` - Build script
* `scripts/` - Utility scripts

### Frontend (`/ui`)

* `src/` - Source code
* `vite.config.ts` - Vite build configuration
* `package.json` - Frontend dependencies
* `embed.go` - UI assets embedding for Go binary

## Getting Started

### Prerequisites

* Go 1.x
* Node.js & npm
* [Air](https://github.com/air-verse/air) for live-reloading the Go backend

  ```bash
  go install github.com/air-verse/air@latest
  ```

### Development

1. **Backend**

   ```bash
   nu build.nu ui  # First time only
   air
   ```

2. **Frontend**

   ```bash
   cd ui
   npm install
   npm run dev
   ```

### Initialization

After first launch, the application requires seed data to be provided. Visit `/dump` endpoint to upload the initial data dump. This step is required only once and provides the necessary game data (characters, weapons, artifacts, etc.).

The latest seed data can be found at [gbp.qxuken.dev](https://gbp.qxuken.dev).

### Production

Build and publish Docker images:

```bash
nu publish.nu
```

## Scripts

* `publish.nu` - Builds and publishes Docker images for both arm64 and amd64 architectures
* `build.nu` - Builds the application
* `scripts/` - Utility scripts written in Nushell

## TODO

Refer to [TODO.md](TODO.md) for a list of pending tasks and future improvements.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
