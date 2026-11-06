// Fichier écrit par scripts/photos.ts (npm run photos) : ne pas le modifier à la main.
// Vide tant que les photos du client n'ont pas été traitées : le site garde alors celles de la maquette.

export type PhotoClient = { src: string; alt: string | null; largeur: number; hauteur: number };
export type PhotosEspace = { photos: PhotoClient[]; og: string };

export const PHOTOS_CLIENT: Record<string, PhotosEspace> = {};
