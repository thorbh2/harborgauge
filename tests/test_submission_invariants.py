from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "contracts" / "harborgauge.py").read_text(encoding="utf-8")
CLIENT = (ROOT / "src" / "pages" / "index.tsx").read_text(encoding="utf-8")


def test_release_requires_owner_review_and_closed_filings():
    assert "only_manifest_owner_or_admin" in SOURCE
    assert "open_dispute_or_escalation_blocks_release" in SOURCE


def test_client_uses_real_contract_actions_and_refreshes_after_receipt():
    for method in ("file_dispute", "file_escalation", "release_manifest"):
        assert method in CLIENT
    assert "await waitAccepted(address, hash)" in CLIENT
    assert "await refresh()" in CLIENT


def test_client_does_not_present_fake_fallback_outcomes():
    assert "fallbackManifests" not in CLIENT
    assert "No on-chain manifest" in CLIENT
    assert "Static outcomes are not shown" in CLIENT
