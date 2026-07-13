import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import styles from '../styles/Home.module.css';
import { studionetChainId } from '../wagmi';
import {
  CONTRACT_ADDRESS,
  type Bootstrap,
  type HarborManifest,
  type TxToast,
  explorerContract,
  explorerTx,
  friendlyError,
  getBootstrap,
  hasContract,
  shortHex,
  waitAccepted,
  writeMethod,
} from '../lib/harborgauge';

const DOCS = 'https://docs.genlayer.com/';
const WEB = 'https://docs.genlayer.com/developers/intelligent-contracts/features/web-access';
const SECURITY = 'https://docs.genlayer.com/developers/intelligent-contracts/security-and-best-practices/prompt-injection';

const emptyManifest: HarborManifest = {
  id: '', title: 'No on-chain manifest', terminal: 'Waiting for contract data', vessel: 'No vessel selected',
  routeLane: 'Open a manifest to begin', claim: '', sourceUrl: '', status: 'NO ON-CHAIN DATA',
  verdict: 'not reviewed', confidenceBps: 0, custodyMatchBps: 0, documentRiskBps: 0,
  peakTempC: 0, dwellMinutes: 0, summary: 'No contract record was returned. Static outcomes are not shown.',
  riskFlags: ['NO_ONCHAIN_DATA'],
};

const containerRows = [
  ['HG', '41', '7A', 'OK', '19', 'RF'],
  ['SE', '03', 'T2', 'CL', '88', 'B4'],
  ['CT', '12', 'XM', '9C', 'AR', '07'],
  ['BX', '55', 'Q1', 'LN', '20', 'VX'],
];
const tideBars = [38, 48, 62, 73, 84, 76, 66, 52, 43, 58, 70, 86];

function pct(value: number | undefined): string {
  return `${Math.round(Number(value || 0) / 100)}%`;
}

function docScore(manifest: HarborManifest): number {
  return Math.max(0, 10000 - Number(manifest.documentRiskBps || 0));
}

function displaySummary(summary: string): string {
  if (!summary) return 'Awaiting harbor inspection summary.';
  if (summary.includes('fallback') || summary.includes('unavailable')) {
    return 'Conservative inspection stored while nondeterministic verifier capacity was unavailable.';
  }
  return summary;
}

function displayFlag(flag: string): string {
  if (flag === 'GENLAYER_FALLBACK') return 'CONSERVATIVE_INSPECTION';
  return flag;
}

const Home: NextPage = () => {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [selected, setSelected] = useState(0);
  const [toast, setToast] = useState<TxToast>({ kind: 'idle', title: '' });
  const [busy, setBusy] = useState(false);

  const manifests = bootstrap?.recentManifests ?? [];
  const active = manifests[Math.min(selected, manifests.length - 1)] || emptyManifest;
  const manifestId = useMemo(() => String(active.id || ''), [active.id]);
  const stats = bootstrap?.stats || { manifests: 0, cargoDocuments: 0, sealChecks: 0, vesselReadings: 0, inspections: 0, disputes: 0, escalations: 0, audits: 0 };
  const quality = bootstrap?.quality?.qualityBps ?? 0;

  const refresh = useCallback(async () => {
    const data = await getBootstrap().catch(() => null);
    setBootstrap(data);
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 16000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const run = useCallback(
    async (label: string, functionName: string, args: unknown[]) => {
      if (!hasContract()) {
        setToast({ kind: 'error', title: 'Contract not deployed yet', detail: 'Deploy HarborGauge first.' });
        return;
      }
      if (!isConnected || !address) {
        setToast({ kind: 'error', title: 'Connect wallet first', detail: 'RainbowKit wallet is required for writes.' });
        return;
      }
      if (chainId !== studionetChainId) {
        try {
          await switchChainAsync({ chainId: studionetChainId });
        } catch (error) {
          setToast({ kind: 'error', title: 'Wrong network', detail: friendlyError(error) });
          return;
        }
      }
      setBusy(true);
      setToast({ kind: 'pending', title: `${label}: confirm in wallet` });
      try {
        const hash = await writeMethod(address, functionName, args);
        setToast({ kind: 'pending', title: `${label}: waiting for acceptance`, hash });
        await waitAccepted(address, hash);
        setToast({ kind: 'ok', title: `${label}: accepted`, hash });
        await refresh();
      } catch (error) {
        setToast({ kind: 'error', title: `${label} failed`, detail: friendlyError(error) });
      } finally {
        setBusy(false);
      }
    },
    [address, chainId, isConnected, refresh, switchChainAsync],
  );

  const actions = [
    {
      label: 'Open manifest',
      fn: 'open_manifest',
      args: [
        'Reefer lane MZ-17 clearance',
        'Berth 7 / Tanger Med cold yard',
        'MV Atlas Current',
        'TNG -> VLC -> ROT',
        'Cargo documents, seal checks and reefer readings should support a clean release.',
        DOCS,
      ],
    },
    ...(manifestId ? [
      { label: 'Cargo doc', fn: 'add_cargo_document', args: [manifestId, 'bill of lading', DOCS, 'Public bill-of-lading source matches vessel, route and cargo class.'] },
      { label: 'Seal check', fn: 'add_seal_check', args: [manifestId, 'door seal scan', 'HG-SEAL-7719', WEB, 'Seal scan was matched at crane apron intake.'] },
      { label: 'Custody log', fn: 'log_vessel_reading', args: [manifestId, 4, 'reefer within tolerance', 42, 'Cold-chain dwell remained inside accepted harbor window.'] },
      { label: 'Inspect', fn: 'open_inspection', args: [manifestId] },
      { label: 'AI inspect', fn: 'inspect_manifest_with_genlayer', args: [manifestId] },
      { label: 'Dispute', fn: 'file_dispute', args: [manifestId, 'The current inspection needs counter-evidence review before release.', SECURITY] },
      { label: 'Escalate', fn: 'file_escalation', args: [manifestId, 'Escalate the unresolved custody and document risk for a second review.', WEB] },
      { label: 'Release', fn: 'release_manifest', args: [manifestId] },
    ] : []),
  ];

  return (
    <div className={styles.shell}>
      <Head>
        <title>HarborGauge</title>
        <meta name="description" content="GenLayer harbor cargo custody protocol with RainbowKit wallet actions." />
      </Head>

      <main className={styles.harbor}>
        <section className={styles.signalMast}>
          <div className={styles.identity}>
            <span>Studionet cargo custody</span>
            <h1>HarborGauge</h1>
          </div>
          <a className={styles.contractPlate} href={hasContract() ? explorerContract() : '#'} target={hasContract() ? '_blank' : undefined} rel="noreferrer">
            <span>{hasContract() ? 'contract live' : 'contract pending'}</span>
            <strong>{hasContract() ? shortHex(CONTRACT_ADDRESS) : 'not deployed'}</strong>
          </a>
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const connected = mounted && account && chain;
              if (!connected) return <button className={styles.walletButton} onClick={openConnectModal} type="button">Connect wallet</button>;
              if (chain.unsupported) return <button className={styles.walletWarn} onClick={openChainModal} type="button">Switch network</button>;
              return (
                <div className={styles.walletStack}>
                  <button className={styles.chainButton} onClick={openChainModal} type="button">{chain.name}</button>
                  <button className={styles.accountButton} onClick={openAccountModal} type="button">{account.displayName}</button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </section>

        <section className={styles.metricStrip}>
          {[
            ['manifests', stats.manifests],
            ['cargo docs', stats.cargoDocuments],
            ['seals', stats.sealChecks],
            ['readings', stats.vesselReadings],
            ['audits', stats.audits],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className={styles.manifestRail}>
          <div className={styles.railHead}>
            <span>Manifest lane</span>
            <strong>{pct(quality)} quality</strong>
          </div>
          {manifests.map((manifest, index) => (
            <button
              key={`${manifest.id}-${manifest.title}`}
              className={`${styles.manifestTicket} ${index === selected ? styles.manifestTicketActive : ''}`}
              onClick={() => setSelected(index)}
              type="button"
            >
              <span>{manifest.status}</span>
              <strong>{manifest.title}</strong>
              <small>{manifest.terminal}</small>
            </button>
          ))}
          {manifests.length === 0 && <p>No on-chain manifests returned. Connect a wallet and open the first manifest.</p>}
        </section>

        <section className={styles.yard}>
          <div className={styles.yardHeader}>
            <div>
              <span>{active.vessel}</span>
              <h2>{active.routeLane}</h2>
            </div>
            <strong>{active.verdict}</strong>
          </div>
          <div className={styles.visualDeck}>
            <div className={styles.radar}>
              <span className={styles.radarSweep} />
              <div>
                <small>custody match</small>
                <strong>{pct(active.custodyMatchBps)}</strong>
              </div>
            </div>
            <div className={styles.containerYard}>
              {containerRows.flatMap((row, y) =>
                row.map((cell, x) => (
                  <span key={`${cell}-${x}-${y}`} className={(x + y) % 3 === 0 ? styles.containerHot : styles.container} style={{ '--tier': `${y}` } as CSSProperties}>
                    {cell}
                  </span>
                )),
              )}
            </div>
          </div>
          <div className={styles.tideGraph}>
            {tideBars.map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%`, '--delay': `${index * 35}ms` } as CSSProperties} />
            ))}
          </div>
          <p>{displaySummary(active.summary)}</p>
          <div className={styles.flagRow}>
            {active.riskFlags.map((flag) => <span key={flag}>{displayFlag(flag)}</span>)}
          </div>
        </section>

        <section className={styles.controlRoom}>
          <div className={styles.operator}>
            <span>Operator wallet</span>
            <strong>{isConnected && address ? shortHex(address) : 'not connected'}</strong>
          </div>
          <div className={styles.scoreboard}>
            <div><span>Confidence</span><b>{pct(active.confidenceBps)}</b></div>
            <div><span>Docs</span><b>{pct(docScore(active))}</b></div>
            <div><span>Custody</span><b>{pct(active.custodyMatchBps)}</b></div>
            <div><span>Dwell</span><b>{active.dwellMinutes}m</b></div>
          </div>
          <div className={styles.actionPanel}>
            {actions.map((action) => (
              <button
                key={action.fn}
                className={styles.actionButton}
                disabled={busy || !isConnected}
                onClick={() => run(action.label, action.fn, action.args)}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
          {toast.kind !== 'idle' && (
            <div className={`${styles.toast} ${styles[`toast_${toast.kind}`]}`}>
              <strong>{toast.title}</strong>
              {toast.detail && <span>{toast.detail}</span>}
              {toast.hash && <a href={explorerTx(toast.hash)} target="_blank" rel="noreferrer">{shortHex(toast.hash, 10, 8)}</a>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
