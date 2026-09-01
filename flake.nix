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
        nodejs = pkgs.nodejs_23;
        pnpm = pkgs.pnpm_9;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            pnpm
            nodePackages_latest.vercel
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "astro-site";
          version = "0.0.1";
          src = ./.;

          nativeBuildInputs = [
            nodejs
            pnpm.configHook
          ];

          pnpmDeps = pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            hash = "sha256-1id+voa1Bil+2YUPa7kMwf1YLCZ2lT1Fp2S31pD8UyY=";
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
