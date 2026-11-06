import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite charge ses fichiers WASM et data depuis node_modules au démarrage : il reste un paquet
  // Node externe, non empaqueté (à vérifier au premier build : provisoire, sans source écrite).
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
};

export default nextConfig;
