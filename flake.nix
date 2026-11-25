{
  description = "Suwayomi-WebUI: web client for Suwayomi-Server (development shell and production build)";

  inputs = {
    # Rolling channel. The exact revision is pinned in flake.lock; bump it with `nix flake update`.
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      # Node.js: package.json "engines" and .nvmrc require >= 24.20.0. nixpkgs' `nodejs_24` tracks the
      # latest 24.x release, which satisfies that. The `assert`s in the dev shell and the package turn
      # a channel regression into a clear evaluation error instead of a confusing runtime failure.
      minNode = "24.20.0";

      # pnpm: package.json pins "packageManager": "pnpm@11.1.2". nixpkgs only ships the newest release
      # of each major, so `pnpm_11` is a newer 11.x. That is fine because the lockfile format
      # (lockfileVersion 9.0) is shared across pnpm 10 and 11. See `fetchPnpmDeps` below.
      mkPnpm = pkgs: pkgs.pnpm_11.override { nodejs-slim = pkgs.nodejs-slim_24; };
    in
    {
      packages = forAllSystems (
        pkgs:
        let
          pnpm = mkPnpm pkgs;
          packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        in
        {
          # The static WebUI bundle: the same output as `pnpm build` (the contents of `build/`), ready to
          # be served by any web server or bundled into Suwayomi-Server's webUI directory.
          default =
            assert pkgs.lib.assertMsg (pkgs.lib.versionAtLeast pkgs.nodejs_24.version minNode)
              "nodejs_24 in this nixpkgs (${pkgs.nodejs_24.version}) is older than the required ${minNode}";
            pkgs.stdenv.mkDerivation (finalAttrs: {
              pname = "suwayomi-webui";
              version = packageJson.version;

              # Only the files `vite build` reads. This keeps the derivation (and its rebuilds) from
              # depending on docs, CI config, the flake itself, etc.
              src = pkgs.lib.fileset.toSource {
                root = ./.;
                fileset = pkgs.lib.fileset.unions [
                  ./.env.template
                  ./index.html
                  ./lingui.config.ts
                  ./package.json
                  ./pnpm-lock.yaml
                  ./pnpm-workspace.yaml
                  ./public
                  ./src
                  ./tools
                  ./tsconfig.json
                  ./tsconfig.node.json
                  ./vite.config.ts
                ];
              };

              nativeBuildInputs = [
                pkgs.nodejs_24
                pnpm
                pkgs.pnpmConfigHook
              ];

              # Fixed-output derivation holding the pnpm store for the locked dependencies.
              # Update `hash` whenever pnpm-lock.yaml changes: set it to `pkgs.lib.fakeHash`, run
              # `nix build`, and copy the hash Nix reports.
              pnpmDeps = pkgs.fetchPnpmDeps {
                inherit (finalAttrs) pname version src;
                inherit pnpm;
                fetcherVersion = 5;
                hash = "sha256-OEzeCU7YHeby412CdF0i0oJn+X4d8DxTa0HaPx+eTuI=";
              };

              buildPhase = ''
                runHook preBuild
                # `pnpm build` is skipped on purpose: it runs `pnpm setup` (network install and .env
                # creation), which the Nix sandbox has already covered through `pnpmDeps`.
                pnpm exec vite build
                runHook postBuild
              '';

              installPhase = ''
                runHook preInstall
                cp -r build $out
                runHook postInstall
              '';

              meta = {
                description = "Web client for Suwayomi-Server";
                homepage = "https://github.com/Suwayomi/Suwayomi-WebUI";
                license = pkgs.lib.licenses.mpl20;
                platforms = systems;
              };
            });
        }
      );

      devShells = forAllSystems (
        pkgs:
        let
          pnpm = mkPnpm pkgs;
        in
        {
          default =
            assert pkgs.lib.assertMsg (pkgs.lib.versionAtLeast pkgs.nodejs_24.version minNode)
              "nodejs_24 in this nixpkgs (${pkgs.nodejs_24.version}) is older than the required ${minNode}";
            pkgs.mkShell {
              name = "suwayomi-webui-dev";

              packages = [
                pkgs.nodejs_24
                pnpm
                pkgs.git # husky (the `prepare` script), lint-staged and the release scripts call git
              ];

              shellHook = ''
                # pnpm 11 otherwise downloads the exact version from package.json's "packageManager"
                # field (11.1.2) into ~/.local/share/pnpm and re-executes that instead of the Nix one.
                # `ignore` keeps the Nix-provided pnpm. (The variable name is case-sensitive.)
                export pnpm_config_pm_on_fail=ignore

                # Vite 8 (rolldown), swc, esbuild, oxlint, oxfmt and tsgo are prebuilt native binaries
                # from npm that expect a standard dynamic loader. NixOS has none unless nix-ld is on.
                if [ ! -e /lib64/ld-linux-x86-64.so.2 ] && [ ! -e /lib/ld-linux-aarch64.so.1 ]; then
                  echo "warning: no standard dynamic loader found; npm's prebuilt binaries will fail." >&2
                  echo "         On NixOS enable it with: programs.nix-ld.enable = true;" >&2
                fi
              '';
            };
        }
      );

      formatter = forAllSystems (pkgs: pkgs.nixfmt);
    };
}
