// Déclare les fichiers CSS comme modules valides pour TypeScript.
// Nécessaire avec moduleResolution: "bundler" — la résolution CSS est
// déléguée à Webpack/Turbopack ; TypeScript ne la connaît pas nativement.
declare module "*.css";
