# Security Notice (Hackathon MVP)

This project demonstrates a **post-quantum (PQ) proof-of-possession** flow for a Solana vault on **devnet**.

## Local PQ Key Storage (Important)

For hackathon/demo simplicity, **PQ keys are stored in the browser `localStorage`**.

### Do not reuse this setup for production

Never deploy or reuse this demo approach on mainnet without **hardware-backed key storage** (or another secure, audited mechanism) to protect PQ private keys.

## Hackathon MVP, Not a Production Security Product

Treat this repository as an educational hackathon MVP. It is not hardened for real-world threat models, key recovery, or production-grade security requirements.

