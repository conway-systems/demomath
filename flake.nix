{
  description = "astro setup... fingers crossed";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs;
        pnpm = pkgs.pnpm;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            pnpm
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "devel";
          version = "0.0.1";
          src = ./.;

          nativeBuildInputs = [
            nodejs
            pnpm.configHook
          ];

          pnpmDeps = pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            fetcherVersion = 4;
            hash = "sha256-XIILHhqTkS5p+O/pNHxYUsp/OCqK74IB5trSNIJulRE=";
          };

          buildPhase = ''
            pnpm run build
          '';

          installPhase = ''
            cp -r dist $out
          '';
        });

        formatter = pkgs.nixpkgs-fmt;
      });
}
