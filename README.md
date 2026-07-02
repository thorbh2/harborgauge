# HarborGauge

HarborGauge is a GenLayer cargo custody and cold-chain release protocol for manifests, seal checks, reefer readings, inspections, disputes and final release.

Terminal operators attach cargo documents and custody readings, run GenLayer inspection over the evidence, then clear, dispute, escalate or release a manifest with an audit trail.

## Live System

| Surface | Link |
| --- | --- |
| App | https://harborgauge.vercel.app |
| GitHub | https://github.com/thorbh2/harborgauge |
| Contract | https://explorer-studio.genlayer.com/contracts/0x33B30e29925dC6E3925022EAEE2D014ef876DA3B |
| Network | GenLayer Studionet |

## What Ships

- Product frontend with wallet-gated write actions and public read views.
- GenLayer contract source in `contracts/harborgauge.py`.
- Deployment metadata in `deployment.json`.
- Frontend contract client in `src/lib/harborgauge.ts`.
- Public contract address pinned as a fallback and documented in `.env.local.example`.

## Contract Model

This is not a one-call demo contract. The on-chain package keeps lifecycle state, evidence records, review outputs, challenge and appeal records, indexed read methods and audit-friendly public views.

Verification record: 18 finalized write transactions, 21/21 read checks.

## Run Locally

```powershell
npm install
npm run dev
```

Open the URL printed by Next.js. The public contract address is already present as a fallback; local env files are optional for normal read-only review.

## Public Environment

```text
NEXT_PUBLIC_CONTRACT_ADDRESS=0x33B30e29925dC6E3925022EAEE2D014ef876DA3B
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER=https://explorer-studio.genlayer.com
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
```

## Deploy

```powershell
npx --yes vercel@latest --prod --yes
```

## Security

- No private keys, vault files, local dashboard data or decrypted wallet material belong in this repository.
- The frontend receives only public `NEXT_PUBLIC_*` values.
- Write actions require a connected wallet confirmation.
- `.env.local`, `.vercel/`, build output and local state are ignored.
