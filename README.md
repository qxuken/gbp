# Genshin Build Planner

## Description

This project appears to be a web application with a Go backend and a React/TypeScript frontend. The backend handles core logic and data persistence (likely through a database, given the presence of migrations), while the frontend provides the user interface. The application can be containerized using Docker.

## Tech Stack

*   **Backend:** Go
*   **Frontend:** TypeScript, React, Vite
*   **Database:** (Inferred, specific type unknown)
*   **Containerization:** Docker
*   **Scripting:** Nushell

## Project Structure

The project is organized into two main parts:

*   **`/` (Root):** Contains the Go backend code, Dockerfile, Go module files, and migration scripts.
    *   `main.go`: Main application entry point.
    *   `internals/`: Core backend logic.
    *   `migrations/`: Database migration files.
    *   `Dockerfile`: For building a Docker image.
*   **`/ui`:** Contains the frontend React application.
    *   `ui/src/main.tsx`: Frontend application entry point.
    *   `ui/src/routes/`: Application routing.
    *   `ui/src/components/`: UI components.
    *   `ui/src/store/`: State management.
    *   `ui/src/api/`: API interaction logic.
    *   `ui/vite.config.ts`: Vite build configuration.
    *   `ui/package.json`: Frontend dependencies.
    *   `ui/embed.go`: Likely used to embed UI assets into the Go binary.

## Getting Started

### Prerequisites

*   Go
*   Node.js & npm (or your preferred package manager like yarn or pnpm)
*   [Air](https://github.com/air-verse/air): For live-reloading the Go backend during development. Install with:
    ```bash
    go install github.com/air-verse/air@latest
    ```

### Building and Running

1.  **Backend (Development):**
    *   Ensure you have `air` installed (see Prerequisites).
    *   Navigate to the project root directory.
    *   Run the backend with live-reloading:
        ```bash
        air
        ```

2.  **Frontend (Development):**
    *   Navigate to the frontend directory:
        ```bash
        cd ui
        ```
    *   Install dependencies (if you haven't already):
        ```bash
        npm install
        ```
        (Or `yarn install` / `pnpm install` if you use those)
    *   Start the Vite development server:
        ```bash
        npm run dev
        ```

For building and publishing Docker images, please refer to the `publish.nu` script.

## Scripts

*   `publish.nu`: building docker images (arm64, amd64) and publishing to registry. This is the recommended way to create and publish containerized versions of the application.
*   `scripts/`: Contains utility scripts written in Nushell.

## TODO

Refer to `todo.md` for a list of pending tasks and future improvements.
