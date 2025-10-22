{
  description = "Dev environment with Node.js, pnpm, bun, and other JS tools via devenv + flakes";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    devenv.url = "github:cachix/devenv";
  };

  nixConfig = {
    extra-trusted-public-keys = "habinook.cachix.org-1:LK70GVcmF7Cj3lmrUGWn8kH9rwsEBshEkA5G+YQ0Uu8=";
    extra-substituters = "https://habinook.cachix.org";
  };

  outputs = { self, nixpkgs, flake-utils, devenv, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = devenv.lib.mkShell {
          inherit pkgs inputs;
          modules = [
            ({ pkgs, ... }: {
              # Основные пакеты
              packages = with pkgs; [
                nodejs_24
                pnpm_10
                bun
                git
                toybox
                lefthook
                biome
                wrangler
              ];

              # Пример запуска команды при входе
              enterShell = ''
                echo "🚀 Welcome to JS Dev Environment!"
                node -v
                pnpm -v
                bun --version
              '';

              # Пример background процесса
              processes.dev.exec = "pnpm dev";
            })
          ];
        };

        packages.default = pkgs.hello;
      });
}
