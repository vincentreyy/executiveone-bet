"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Dot, Pagination } from "./UserScreens";
import { useEntrantLookup } from "@/lib/entrantContext";
import { fmt, money, ago, poolOf, driverPools, PAGE_SIZE } from "@/lib/store";

const BET_STATUS = [["all", "All"], ["pending", "Pending"], ["won", "Won"], ["lost", "Lost"], ["void", "Void"]];
const BET_BADGE = { pending: "b-pend", won: "b-open", lost: "b-live", void: "b-set" };

// Admin-only: who backed which entrant, per race. S.bets comes from
// getPoolBetsForAdmin (real names + IGNs) and S.races from an unfiltered
// getRaceList, so hidden races are included here.
export function AdminBettors({ S }) {
  const D = useEntrantLookup();
  const params = useSearchParams();
  const [sel, setSel] = useState(params.get("race") || "");
  const [rq, setRq] = useState("");
  const [rPage, setRPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const sorted = S.races.slice().sort((a, b) => b.dt - a.dt);
  const races = sorted.filter(r => r.name.toLowerCase().includes(rq.toLowerCase()));
  const rPageCount = Math.max(1, Math.ceil(races.length / PAGE_SIZE));
  const rp = Math.min(rPage, rPageCount);

  const race = S.races.find(r => r.id === sel);
  const raceBets = race ? S.bets.filter(b => b.raceId === race.id) : [];
  const matches = b => (status === "all" || b.status === status)
    && (b.user + " " + (b.ign || "")).toLowerCase().includes(q.toLowerCase());
  const shown = raceBets.filter(matches);
  const pools = race ? driverPools(S.bets, race).sort((a, b) => b.pool - a.pool) : [];
  const total = race ? poolOf(S.bets, race.id) : 0;
  // Full filtered set, not the visible page — same approach as AdminFinance.
  const shownStake = shown.reduce((s, b) => s + b.stake, 0);
  const season = race?.kind === "season";

  return <div>
    <div className="hdr" style={{ marginBottom: 20 }}>
      <div><h2 className="ttl-lg">Bettors</h2>
        <div className="muted" style={{ fontSize: 13 }}>Who backed whom, per race or championship market. Admin-only — players never see this.</div></div>
    </div>
    <div className="grid g2" style={{ gridTemplateColumns: "340px 1fr", alignItems: "start" }}>
      <div className="card">
        <div className="ttl-sm" style={{ marginBottom: 10 }}>Races</div>
        <input className="input" value={rq} onChange={e => { setRq(e.target.value); setRPage(1); }} placeholder="Search races" style={{ marginBottom: 10 }} />
        {races.slice((rp - 1) * PAGE_SIZE, rp * PAGE_SIZE).map(r => <button key={r.id} onClick={() => { setSel(r.id); setQ(""); setStatus("all"); }}
          className="rowhov" style={{ display: "block", width: "100%", textAlign: "left", background: sel === r.id ? "var(--elev)" : "transparent", border: 0, borderBottom: "1px solid var(--hair)", padding: "10px 6px", color: "inherit", cursor: "pointer" }}>
          <div style={{ fontWeight: 500 }}>{r.name}{r.hidden && <span className="badge b-pend" style={{ marginLeft: 8 }}>Hidden</span>}</div>
          <div className="flex" style={{ gap: 8, alignItems: "center", marginTop: 4 }}>
            <Badge s={r.status} />
            <span className="cap">{fmt(poolOf(S.bets, r.id))} · {S.bets.filter(b => b.raceId === r.id).length} bets</span></div>
        </button>)}
        {!races.length && <div className="muted" style={{ padding: "16px 0", fontSize: 13 }}>No races match.</div>}
        <Pagination page={rp} pageCount={rPageCount} total={races.length} onChange={setRPage} />
      </div>

      <div>
        {!race ? <div className="card muted" style={{ textAlign: "center", padding: "48px 0", fontSize: 13 }}>Pick a race on the left to see its bettors.</div> : <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="flex" style={{ justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div><div className="ttl-md">{race.name}</div>
                <div className="cap">{season ? (race.market === "constructors" ? "Constructors' championship market" : "Drivers' championship market") : "Win market"} · {raceBets.length} bets · pool {money(total)}</div></div>
              <Badge s={race.status} />
            </div>
            <div className="flex" style={{ gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
              <input className="input" style={{ width: 240 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Search player or IGN" />
              <div className="flex" style={{ gap: 6 }}>{BET_STATUS.map(([k, l]) => <button key={k} className={"pill-tab" + (status === k ? " on" : "")} onClick={() => setStatus(k)}>{l}</button>)}</div>
            </div>
            <div className="flex" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hair)" }}>
              <span className="cap" style={{ color: "var(--muted)" }}>{shown.length} {shown.length === 1 ? "bet" : "bets"} match</span>
              <span className="num" style={{ fontWeight: 700 }}>{money(shownStake)} staked</span>
            </div>
          </div>

          {pools.map(p => { const rows = shown.filter(b => b.dId === p.id).sort((a, b) => b.stake - a.stake); const d = D(p.id);
            if (!rows.length) return null;
            return <EntrantSection key={p.id} d={d} pool={p.pool} share={p.share} rows={rows} />; })}
          {!shown.length && <div className="card muted" style={{ textAlign: "center", padding: "32px 0", fontSize: 13 }}>{raceBets.length ? "No bets match these filters." : "Nobody has bet on this yet."}</div>}
        </>}
      </div>
    </div>
  </div>;
}

function EntrantSection({ d, pool, share, rows }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const p = Math.min(page, pageCount);
  return <div className="card" style={{ marginBottom: 16 }}>
    <div className="flex" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div className="flex" style={{ gap: 10, alignItems: "center" }}><Dot d={d} size={26} /><div style={{ fontWeight: 600 }}>{d.n}</div></div>
      <div className="cap">{rows.length} {rows.length === 1 ? "backer" : "backers"} · pool {fmt(pool)} · {(share * 100).toFixed(1)}%</div>
    </div>
    <div className="tblwrap"><table><thead><tr><th>Player</th><th>IGN</th><th>Placed</th><th style={{ textAlign: "right" }}>Stake</th><th style={{ textAlign: "right" }}>% of pick</th><th style={{ textAlign: "right" }}>Status</th></tr></thead>
      <tbody>{rows.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE).map(b => <tr key={b.id} className="rowhov">
        <td style={{ fontWeight: 500 }}>{b.user}</td>
        <td className="muted2" style={{ fontSize: 13 }}>{b.ign}</td>
        <td className="muted num" style={{ fontSize: 13 }}>{ago(b.at)}</td>
        <td className="num" style={{ textAlign: "right" }}>{fmt(b.stake)}</td>
        <td className="num muted2" style={{ textAlign: "right" }}>{pool ? ((b.stake / pool) * 100).toFixed(1) + "%" : "—"}</td>
        <td style={{ textAlign: "right" }}><span className={"badge " + (BET_BADGE[b.status] || "b-set")}>{b.status}</span>
          {b.payout > 0 && <div className="num up" style={{ fontSize: 12 }}>+{fmt(b.payout)}</div>}</td>
      </tr>)}</tbody></table></div>
    <Pagination page={p} pageCount={pageCount} total={rows.length} onChange={setPage} />
  </div>;
}
