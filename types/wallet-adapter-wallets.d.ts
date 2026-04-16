/**
 * Workaround: @solana/wallet-adapter-wallets ships types under paths that do not
 * resolve cleanly with package.json "exports" + TypeScript moduleResolution "bundler".
 */
declare module "@solana/wallet-adapter-wallets";
