# Getting Started with Create React App

This project is built with [Vite](https://vitejs.dev/)

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

This command runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page reloads when you make edits.\
Lint errors also appear in the console.

### `pnpm preview`

This command runs the app in a local preview production build.

### `pnpm build`

This command creates an optimized production build of the app and places it in the `build` folder.
See this section about [Building for Production](https://vitejs.dev/guide/build.html) for more information.

## Nix / NixOS

The repository ships a [Nix flake](./flake.nix) (`x86_64-linux` and `aarch64-linux`) that provides the toolchain and a reproducible production build, so nothing has to be installed globally.

### Development shell

```sh
nix develop          # or: direnv allow  (uses the committed .envrc)
pnpm setup           # install dependencies and create .env
pnpm dev             # dev server on http://localhost:3000
pnpm lint && pnpm format:check && pnpm tsc && pnpm build
```

Or run a single command without entering the shell: `nix develop -c pnpm build`.

- Node.js is `nodejs_24` from nixpkgs (`.nvmrc` / `engines` require >= 24.20.0; the flake fails to evaluate if nixpkgs ever ships an older 24.x).
- pnpm is nixpkgs' `pnpm_11`, which is newer than the `packageManager` pin (`pnpm@11.1.2`) because nixpkgs only ships the latest release of a major version. The shell sets `pnpm_config_pm_on_fail=ignore` so pnpm uses it instead of downloading the pinned version.
- Vite, swc, esbuild, oxlint, oxfmt and tsgo are prebuilt npm binaries. On NixOS they need `programs.nix-ld.enable = true;` in your system configuration (the shell warns if the loader is missing).
- The husky pre-commit hook (lint-staged, `i18n:extract`, `pnpm tsc`) works inside the shell. Commit from within `nix develop` so `pnpm` is on `PATH`.

### Production build

```sh
nix build            # static bundle in ./result (same content as build/)
```

`packages.default` runs `vite build` against the dependencies pinned by `pnpm-lock.yaml`. After changing the lockfile, set `hash` in the `pnpmDeps` attribute of `flake.nix` to `pkgs.lib.fakeHash`, run `nix build`, and paste the hash Nix reports. Update nixpkgs with `nix flake update`.
