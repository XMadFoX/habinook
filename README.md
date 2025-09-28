# Habinook

A habit tracking application.

## Development Setup

To set up the development environment:

1. **Install Nix Package Manager**
   Run the following command:
   ```sh
   sh <(curl --proto '=https' --tlsv1.2 -L https://nixos.org/nix/install) --daemon
   ```
   For more information, refer to the [official Nix installation guide](https://nixos.org/download/).

2. **Enter the Nix Shell**
   ```sh
   nix develop
   ```

3. **Configure Git Hooks**
   ```sh
   lefthook install
   ```

4. **Install Dependencies**
   ```sh
   pnpm install
   ```

5. **Start containers**
   ```sh
   docker compose up -d
   ```

6. **Copy & configure env if needed**
   ```sh
   pushd apps/tanstack-web && cp .env.example .env.local && popd
   ```

7. **Run Database Migrations**
   ```sh
   pnpm db:migrate
   ```

8. **Start the Development Server**
   ```sh
   pnpm dev
   ```