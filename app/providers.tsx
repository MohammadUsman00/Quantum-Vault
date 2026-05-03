"use client";

import React, { ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { RPC_URL } from "@/lib/solana";

// Import required wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface ProvidersProps {
  children: ReactNode;
}

class WalletProviderBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Wallet provider crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg text-center rounded-2xl border border-amber-500/25 bg-amber-500/10 p-6">
            <p className="text-amber-300 text-sm font-medium">
              Please install Phantom wallet and set it to Devnet.
            </p>
            <a
              href="https://phantom.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-violet-300 text-sm hover:text-violet-200"
            >
              Install Phantom
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
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
  // Uses shared RPC source for consistent connection config.
  const endpoint = useMemo(() => RPC_URL, []);

  // Only Phantom for this demo — guard against extension/env issues.
  const wallets = useMemo(() => {
    try {
      if (typeof window === "undefined") return [];
      const hasPhantom =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(window as any)?.phantom?.solana?.isPhantom ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(window as any)?.solana?.isPhantom;
      return hasPhantom ? [new PhantomWalletAdapter()] : [];
    } catch (error) {
      console.error("Wallet adapter init failed:", error);
      return [];
    }
  }, []);

  return (
    <WalletProviderBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={wallets.length > 0}>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </WalletProviderBoundary>
  );
}
