# HarborGauge

HarborGauge is a GenLayer cargo custody and cold-chain release protocol for manifests, seal checks, reefer readings, inspections, disputes and final release.

Terminal operators attach cargo documents and custody readings, run GenLayer inspection over the evidence, then clear, dispute, escalate or release a manifest with an audit trail.

## Live System

| Surface | Link |
| --- | --- |
| App | https://harborgauge.vercel.app |
| GitHub | https://github.com/thorbh2/harborgauge |
| Contract | https://explorer-studio.genlayer.com/contracts/0x7c75e5245AcAa149E30a454F61e6F908148426Fc |
| Deploy tx | https://explorer-studio.genlayer.com/tx/0xf2bd6974fcea7a6bf0c59a00985a3f73b5e92837eaa60d93e9962eb7c98e69d1 |
| Vercel inspect | https://vercel.com/aspros-projects-07dbbeb8/harborgauge/DJjruaMqqXZ79ueHsXDhS5dtkTmu |
| Network | GenLayer Studionet |

## Release Control

The production client no longer invents manifest outcomes when a read fails. It shows an explicit empty or unavailable state and refreshes only after wallet-confirmed receipts. Dispute, escalation and release buttons call the submitted contract methods; release is restricted to the manifest owner or administrator, requires an inspection, and stops while either review path is pending. These guarantees are pinned in `tests/test_submission_invariants.py`.

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
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7c75e5245AcAa149E30a454F61e6F908148426Fc
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
