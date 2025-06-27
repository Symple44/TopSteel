export * from "./api";
export * from "./auth";
export * from "./client";
export * from "./common";
export * from "./devis";
export * from "./forms";
export * from "./production";
export * from "./projet";
export * from "./stock";
export * from "./user";

// Ré-exports pour compatibilité avec l'ancien système
export type { Client as ClientType } from "./client";
export type { Projet as ProjectType } from "./projet";
export type { User as UserType } from "./user";

