{
  description = "Kids Typing Games Hugo site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
    in {
      devShells = forEachSystem (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in {
          default = pkgs.mkShell {
            buildInputs = [
              pkgs.hugo
              pkgs.nodejs
              (pkgs.python313.withPackages (ps: with ps; [
                google-cloud-texttospeech
                google-genai
              ]))
              pkgs.google-cloud-sdk
            ];
            shellHook = ''
              export PATH=$PWD/node_modules/.bin:$PATH
              echo "Dev shell loaded with Hugo ${pkgs.hugo.version}."
            '';
          };
        }
      );
    };
}
