"use client";

import { ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Import required wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers
 * =========
 * Sets up Solana wallet adapter context for the entire app.
 * Targets DEVNET only — never mainnet.
 *
 * Wrapped as "use client" since WalletProvider uses browser APIs.
 */
export default function Providers({ children }: ProvidersProps) {
  // Devnet RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);

  // Only Phantom for this demo — add more adapters here if needed
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
