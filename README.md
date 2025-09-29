# Habinook

A habit tracking application.

## Contributing

### Fork and Clone

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```sh
   git clone https://github.com/your-username/habinook.git
   cd habinook
   ```
3. Add the upstream repository:
   ```sh
   git remote add upstream https://github.com/original-owner/habinook.git
   ```

### Setting up the Development Environment

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

### Code Style and Linting
- We use [Biome](https://biomejs.dev/) for linting and formatting. It's configured in `biome.json`.
- Run lint with:
  ```sh
  biome lint
  ```
- Run format with:
  ```sh
  biome format
  ```
- Run both with:
  ```sh
  biome check
  ```

### Commit Conventions
We require commits to follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This ensures consistent versioning and changelog generation.

Examples:
- `feat(ui): add new habit creation modal`
- `fix(trpc): resolve streak calculation bug`
- `docs: update README with installation steps`
- `chore: update dependencies`

Commitlint runs on pre-commit

### Signing Commits with GPG
All commits must be signed with GPG for security and attribution. If you haven't set up GPG yet follow [this guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key).

### Testing
- We use [bun test](https://bun.com/docs/cli/test), you can run tests with:
  ```sh
  bun test
  ```
- Add tests for new features or bug fixes.

### Submitting Pull Requests
1. Create a branch from `main`:
   ```sh
   git checkout -b feat/your-feature
   ```
2. Make your changes, commit with conventional messages, and sign them.
3. Push to your fork:
   ```sh
   git push origin feature/your-feature
   ```
4. Open a Pull Request (PR) against the upstream `main` branch.
   - Use a clear title following conventional commits.
   - Describe the changes, motivation, and any related issues.
   - Ensure CI passes (linting, tests).

PRs will be reviewed, and we may request changes. Once approved, we'll merge.

If you have questions, open an issue or ask in the PR discussion.

Happy contributing!