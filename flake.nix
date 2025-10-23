{
  description = "Kids Typing Games Hugo site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
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
    };
}
