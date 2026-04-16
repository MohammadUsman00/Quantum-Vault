# Quantum Vault — Solana Frontier Hackathon 2026 (Post-Quantum Track)

## Problem
Solana wallet transaction security today relies on Ed25519 signatures (and associated verification logic) for authorizing ownership and actions. While Ed25519 remains secure against classical attacks, a sufficiently powerful quantum adversary would be able to exploit quantum algorithms (e.g., Shor’s algorithm) to recover private keys from public-key material. This threatens long-term security properties for users who need their “digital identity” and authorization to remain safe well into the quantum era.

## Innovation
Quantum Vault implements a real post-quantum identity layer in the browser using **ML-DSA-65 (CRYSTALS-Dilithium)** via **`@noble/post-quantum`**. The ML-DSA-65 keypair is generated, the wallet address is bound to the PQ identity, and the binding proof is verified client-side—**not simulated**. The on-chain program stores only a commitment (`pq_pubkey_hash`), preserving a forward-looking architecture where classical Solana signatures remain usable for transaction authority while a PQ binding layer strengthens future-proof ownership semantics.

## Architecture
Quantum Vault is intentionally built as a simple three-layer pipeline:

1. **Browser PQ crypto (ML-DSA-65)**
   - Generate ML-DSA-65 keypair in-browser
   - Sign the connected wallet address to create a quantum binding proof
   - Verify the binding proof locally to ensure PQ possession in-session

2. **SHA-256 hash commitment**
   - Hash the ML-DSA-65 public key using SHA-256
   - Use the hash as a compact on-chain commitment (`pq_pubkey_hash`)

3. **Anchor PDA vault account**
   - Create a per-owner PDA vault account on-chain
   - Enforce owner-authorized control using the owner constraint from the wallet signer
   - Support `initialize_vault`, `deposit_sol`, and `withdraw_sol` flows on devnet

## Tech Stack
- **Next.js 16 (App Router)**
- **React + TypeScript**
- **Tailwind CSS v4**
- **Anchor (Rust)**
- **Solana Web3.js**
- **@solana/wallet-adapter** (Phantom integration)
- **@solana/wallet-adapter-react-ui** (wallet modal UI)
- **@noble/post-quantum** (real ML-DSA-65 / FIPS 204 cryptography in browser)
- **Solana devnet**
- **Phantom wallet**

## Live Demo links
- **Devnet Explorer (vault / tx examples):**
  - Initialize/Protect: `https://explorer.solana.com/?cluster=devnet&tx=TBD`
  - Deposit: `https://explorer.solana.com/?cluster=devnet&tx=TBD`
  - Withdraw: `https://explorer.solana.com/?cluster=devnet&tx=TBD`
- **GitHub Repository:**
  - `https://github.com/TBD/TBD`
- **Demo Video:**
  - Loom: https://www.loom.com/TBD
  - YouTube: https://www.youtube.com/watch?v=TBD

## Honest Limitations
- **PQ secret keys are stored in `localStorage` (demo-focused).** This is intentionally optimized for hackathon speed and UX; clearing browser storage removes access to the PQ binding material required for withdrawal in this demo.
- **Transaction authority still uses classical Ed25519 signatures.** The on-chain program remains owner-authorized via the Solana wallet signer, meaning Ed25519 compromise would still affect classical authorization. The PQ layer is designed as an additional binding/commitment mechanism and forward-looking proof of PQ possession, not a replacement for Solana’s current signature scheme in this demo.
- **Devnet-only scope.** The demo runs on Solana devnet and uses devnet faucet/airdrop assumptions.

## Future Work
- **SPL token support:** extend the vault to deposit/withdraw SPL tokens beyond SOL.
- **WebAuthn-backed PQ key storage:** replace `localStorage` with a hardware-backed or OS-backed secure enclave flow where PQ key material can be stored and accessed safely.
- **Multi-sig and policy controls:** add multi-sig / policy-based authorization flows for vault management and advanced safety controls (e.g., recovery, staged withdrawals, and role separation).

