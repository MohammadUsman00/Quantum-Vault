# ⚛️ Quantum Vault
### Solana Frontier Hackathon 2026 — Post-Quantum Track

A non-custodial wallet protection system that migrates Solana assets into a quantum-resistant vault using **CRYSTALS-Dilithium (ML-DSA-65)** post-quantum cryptography.

---

## 🚀 Quick Start (Frontend Only)

```bash
cd quantum-vault
npm install
npm run dev
# → http://localhost:3000
```

> The frontend runs fully without a deployed program. The "Protect Now" flow will simulate on-chain transactions if the program isn't deployed, so you can demo the full UX immediately.

---

## 🔐 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| PQ Crypto | `@noble/post-quantum` — ML-DSA-65 (FIPS 204) |
| Solana | `@solana/web3.js` + Phantom wallet adapter |
| Smart Contract | Anchor (Rust) — Solana devnet |
| Storage | On-chain PDA + localStorage |

---

## 📁 File Structure

```
quantum-vault/
├── app/
│   ├── layout.tsx          → Root layout with WalletProvider
│   ├── providers.tsx       → Solana wallet adapter (devnet)
│   ├── page.tsx            → Landing page
│   └── vault/
│       └── page.tsx        → Vault dashboard
├── components/
│   ├── ConnectWallet.tsx   → Phantom connect button
│   ├── VaultDashboard.tsx  → Main dashboard
│   ├── QuantumRiskScore.tsx → Canvas risk gauge
│   ├── PQKeyDisplay.tsx    → PQ key info
│   ├── AssetList.tsx       → SOL + token balances
│   └── ProtectButton.tsx   → 7-step protection flow
├── lib/
│   ├── pq-crypto.ts        → @noble/post-quantum ML-DSA-65 logic
│   ├── solana.ts           → web3.js helpers
│   ├── vault-program.ts    → Anchor program client
│   └── idl/
│       └── quantum_vault.json → Embedded Anchor IDL
└── program/                → Anchor smart contract (Rust)
    ├── Anchor.toml
    ├── Cargo.toml
    └── programs/quantum-vault/src/lib.rs
```

---

## ⛓️ Deploy the Anchor Program (Required for Real Transactions)

### Prerequisites

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# 3. Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest
```

### Build & Deploy

```bash
# Set Solana to devnet
solana config set --url devnet

# Create / fund your wallet (if needed)
solana-keygen new
solana airdrop 2

# Build the Anchor program
cd program
anchor build

# Get the auto-generated program ID
anchor keys list
# Output: quantum_vault: <YOUR_PROGRAM_ID>

# Update the declare_id! in lib.rs with YOUR_PROGRAM_ID
# Update PROGRAM_ID in lib/vault-program.ts with YOUR_PROGRAM_ID
# Update lib/idl/quantum_vault.json "metadata.address" with YOUR_PROGRAM_ID
# Update program/Anchor.toml [programs.devnet] with YOUR_PROGRAM_ID

# Rebuild after updating ID
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
# Output: Program Id: <YOUR_PROGRAM_ID>
# → Paste this into lib/vault-program.ts PROGRAM_ID
```

### Verify Deployment

```bash
solana program show <YOUR_PROGRAM_ID> --url devnet
```

---

## 🔑 PQ Cryptography Details

| Property | Value |
|----------|-------|
| Algorithm | ML-DSA-65 (CRYSTALS-Dilithium) |
| Standard | FIPS 204 (NIST approved 2024) |
| Security Level | NIST Level 3 (≈ AES-192) |
| Public Key Size | 1,952 bytes |
| Secret Key Size | 4,032 bytes |
| Signature Size | ~3,309 bytes |
| Library | `@noble/post-quantum` (audited) |

**Why ML-DSA?** Ed25519 (used by all Solana wallets) is broken by Shor's algorithm on a quantum computer with ~4,000 logical qubits. ML-DSA is designed to resist both classical and quantum attacks.

---

## 🛡️ Protect Now — 7 Step Flow

1. **Generate ML-DSA-65 keypair** — `ml_dsa65.keygen(seed)` in browser
2. **Sign wallet address** — `ml_dsa65.sign(message, secretKey)` creates binding proof
3. **Verify binding** — `ml_dsa65.verify(sig, message, publicKey)` confirms it's valid
4. **Hash PQ public key** — SHA-256(publicKey) → 32 bytes for on-chain storage
5. **Initialize vault** — Creates PDA account on-chain via Anchor instruction
6. **Deposit SOL** — CPI transfer from wallet → PDA vault
7. **Secure keys** — Store PQ secret key base64-encoded in localStorage

---

## ⚠️ Security Warnings

- **localStorage**: The PQ secret key is stored in localStorage for the hackathon demo. In production, use WebAuthn/hardware-backed storage.
- **Devnet only**: All transactions go to Solana devnet. Never connect mainnet.
- **Key backup**: If you clear browser data, you lose access to withdraw from your vault.

---

## 🔗 Links

- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum)
- [FIPS 204 (ML-DSA)](https://doi.org/10.6028/NIST.FIPS.204)
- [Anchor Framework](https://www.anchor-lang.com/)
