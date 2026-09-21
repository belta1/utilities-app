// SPLITTER — cuentas de restaurante repartidas por el agente (github.com/belta1/splitter-agent).
// Quien debe a quien, historial de boletas, personas y ajustes (quien paga por defecto, emails).
// Datos: /api/splitter/* sobre las tablas splitter_* que el agente escribe.
import { useState, useEffect, useMemo, useCallback } from "react";
import { T, PAPER } from "./_lib/splitter/tokens.jsx";

const MONO = "'JetBrains Mono',monospace";
const GROT = "'Space Grotesk',sans-serif";

// ═══════════════════════════════════════════════════════════════
// API + FORMAT HELPERS
// ═══════════════════════════════════════════════════════════════
async function api(method, url, body) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`sin respuesta de ${location.host} (${method} ${url})`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

const pad = (n) => String(n).padStart(2, "0");
const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
// Manual formatting: identical on the server and in every browser, so SSR and hydration agree.
const fmtDate = (iso) => { if (!iso) return ""; const d = parseDate(iso); return `${DIAS[d.getDay()]} ${pad(d.getDate())} ${MESES[d.getMonth()]}`; };
const fmtMoney = (n, decimals = 0) => {
  const v = Number(n) || 0;
  const [int, frac] = Math.abs(v).toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "-" : ""}$${grouped}${frac ? "," + frac : ""}`;
};
const decimalsOf = (currency) => (["CLP", "JPY", "KRW", "PYG"].includes(currency) ? 0 : 2);

// One GET resource + refresh; mutations go through run() so errors land in one place.
function useResource(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => api("GET", url).then((d) => { setData(d); setError(null); }).catch((e) => setError(e.message)), [url]);
  useEffect(() => { refresh(); }, [refresh]);
  const run = async (fn) => {
    setBusy(true); setError(null);
    try { const r = await fn(); await refresh(); return r; } catch (e) { setError(e.message); throw e; } finally { setBusy(false); }
  };
  return { data, error, busy, loading: data === null && !error, refresh, run };
}

// ═══════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════
const Label = ({ children, color = T.faint, style }) => (
  <div style={{ fontSize: 8, letterSpacing: 2, color, fontFamily: MONO, ...style }}>{children}</div>
);

const Card = ({ accent, children, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.line}`, borderLeft: accent ? `3px solid ${accent}` : undefined, borderRadius: 13, padding: "12px 14px", cursor: onClick ? "pointer" : undefined, ...style }}>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", minWidth: 0, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8,
  color: T.bone, padding: "8px 9px", fontFamily: GROT, fontSize: 14, fontWeight: 700, outline: "none",
};

const Field = ({ label, accent = T.copper, ...input }) => (
  <label style={{ flex: 1, minWidth: 0 }}>
    <Label style={{ marginBottom: 4 }}>{label}</Label>
    <input {...input} style={{ ...inputStyle, borderColor: input.value ? accent + "88" : T.line }} />
  </label>
);

const Btn = ({ children, onClick, accent = T.copper, disabled, small, ghost, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: ghost ? "none" : disabled ? T.raised : accent, color: ghost ? accent : disabled ? T.faint : T.bg,
    border: ghost ? `1px solid ${accent}66` : "none", borderRadius: 8, cursor: disabled ? "default" : "pointer",
    padding: small ? "5px 9px" : "9px 14px", fontFamily: GROT, fontWeight: 700, fontSize: small ? 11 : 13,
    letterSpacing: 0.5, whiteSpace: "nowrap", transition: "all .15s", ...style,
  }}>{children}</button>
);

const Empty = ({ children }) => (
  <div style={{ textAlign: "center", padding: "18px 0", color: T.faint, fontFamily: MONO, fontSize: 10, letterSpacing: 1 }}>{children}</div>
);
const ErrorNote = ({ children }) => children ? <div style={{ marginTop: 6, fontSize: 10, color: T.ember, fontFamily: MONO }}>{children}</div> : null;

// Name chip: who is in a check; green once their part is paid back.
const Chip = ({ name, amount, settled, payer, decimals }) => (
  <span style={{
    display: "inline-flex", gap: 6, alignItems: "baseline", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontFamily: MONO,
    background: T.bg, border: `1px solid ${payer ? T.copper + "88" : settled ? T.sage + "66" : T.line}`,
    color: payer ? T.copper : settled ? T.sage : T.bone,
  }}>
    <span>{name}</span>
    <span style={{ fontFamily: GROT, fontWeight: 700 }}>{payer ? "pago" : fmtMoney(amount, decimals)}</span>
  </span>
);

// ═══════════════════════════════════════════════════════════════
// LA BOLETA — paper ticket: mono type, dotted leaders, torn edge
// ═══════════════════════════════════════════════════════════════
const TicketLine = ({ left, right, bold, muted, indent }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 6, paddingLeft: indent ? 12 : 0, color: muted ? PAPER.soft : PAPER.ink, fontWeight: bold ? 700 : 400 }}>
    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{left}</span>
    <span style={{ flex: 1, borderBottom: `1px dotted ${PAPER.rule}`, transform: "translateY(-3px)" }} />
    <span style={{ whiteSpace: "nowrap" }}>{right}</span>
  </div>
);

const Ticket = ({ title, sub, children, stamp }) => (
  <div className="ticket" style={{ position: "relative", background: PAPER.bg, color: PAPER.ink, fontFamily: MONO, fontSize: 11, lineHeight: 1.75, padding: "16px 16px 18px", marginBottom: 18 }}>
    {stamp && (
      <div style={{ position: "absolute", right: 14, top: 12, transform: "rotate(-9deg)", border: `2px solid ${PAPER.stamp}`, color: PAPER.stamp, borderRadius: 4, padding: "1px 7px", fontFamily: GROT, fontWeight: 700, fontSize: 12, letterSpacing: 2, opacity: 0.85 }}>{stamp}</div>
    )}
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>{title}</div>
      {sub && <div style={{ color: PAPER.soft, fontSize: 10 }}>{sub}</div>}
    </div>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// TAB — SALDOS: who still owes the payer, mark as paid
// ═══════════════════════════════════════════════════════════════
const SaldosTab = ({ settings }) => {
  const bal = useResource("/api/splitter/balances");
  const [open, setOpen] = useState(null);
  const payer = settings?.default_payer || "Jose";

  const rows = bal.data || [];
  const byPayer = useMemo(() => {
    const m = new Map();
    for (const r of rows) { const k = r.paid_by || "?"; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
    return [...m.entries()];
  }, [rows]);
  const total = rows.reduce((s, r) => s + Number(r.owes), 0);

  if (bal.loading) return <Empty>cargando…</Empty>;
  if (bal.data === null) return <div style={{ padding: 14 }}><ErrorNote>{bal.error}</ErrorNote></div>;

  return (
    <div style={{ padding: "14px 14px 26px" }} className="fadein">
      <Ticket title={`Le deben a ${byPayer.length === 1 ? byPayer[0][0] : payer}`} sub={rows.length ? `${rows.length} ${rows.length === 1 ? "persona" : "personas"} · sin pagar` : "nadie debe nada"} stamp={rows.length ? null : "AL DIA"}>
        {byPayer.map(([who, list]) => (
          <div key={who} style={{ marginBottom: byPayer.length > 1 ? 8 : 0 }}>
            {byPayer.length > 1 && <div style={{ color: PAPER.soft, fontSize: 10 }}>a {who}</div>}
            {list.map((r) => <TicketLine key={r.person_name} left={`${r.person_name}  (${r.checks} ${r.checks === 1 ? "cuenta" : "cuentas"})`} right={fmtMoney(r.owes)} />)}
          </div>
        ))}
        <div style={{ borderTop: `1px dashed ${PAPER.rule}`, marginTop: 8, paddingTop: 6 }}>
          <TicketLine left="TOTAL PENDIENTE" right={fmtMoney(total)} bold />
        </div>
      </Ticket>

      {rows.length === 0 ? <Empty>SIN DEUDAS PENDIENTES</Empty> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => {
            const key = `${r.person_name}|${r.paid_by}`;
            const isOpen = open === key;
            return (
              <Card key={key} accent={isOpen ? T.ember : undefined}>
                <div onClick={() => setOpen(isOpen ? null : key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontFamily: GROT, fontSize: 14, fontWeight: 700, color: T.bone }}>{r.person_name}</div>
                    <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO }}>debe a {r.paid_by} · {r.checks} {r.checks === 1 ? "cuenta" : "cuentas"}</div>
                  </div>
                  <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 16, color: T.ember }}>{fmtMoney(r.owes)}</div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {r.detail.map((d) => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8, padding: "7px 10px" }}>
                        <div>
                          <div style={{ fontFamily: GROT, fontSize: 12, fontWeight: 700, color: T.bone }}>{d.restaurant || d.id}</div>
                          <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO }}>{fmtDate(d.check_date)}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: GROT, fontWeight: 700, color: T.bone }}>{fmtMoney(d.owes)}</span>
                          <Btn small accent={T.sage} disabled={bal.busy} onClick={() => bal.run(() => api("PATCH", `/api/splitter/checks/${d.id}/shares/${encodeURIComponent(r.person_name)}`, { settled: true }))}>PAGADO</Btn>
                        </div>
                      </div>
                    ))}
                    <ErrorNote>{bal.error}</ErrorNote>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB — CUENTAS: history; a tapped check opens as the boleta
// ═══════════════════════════════════════════════════════════════
const CheckTicket = ({ id, onChange, busy }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const load = useCallback(() => api("GET", `/api/splitter/checks/${id}`).then(setData).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <Empty>cargando…</Empty>;
  const r = data.result;
  const dec = r.decimals ?? decimalsOf(data.currency);
  return (
    <div style={{ marginTop: 12 }}>
      <Ticket title={data.restaurant || data.id} sub={`${fmtDate(data.check_date)}${data.paid_by ? ` · pago ${data.paid_by}` : ""}`}>
        {r.items.map((it) => it.units.map((payers, u) => (
          <div key={`${it.line}-${u}`}>
            <TicketLine left={`${it.qty > 1 ? `${u + 1}/${it.qty} ` : ""}${it.name}`} right={fmtMoney(it.unit_price, dec)} />
            <div style={{ color: PAPER.soft, fontSize: 9.5, marginTop: -5, marginBottom: 2, paddingLeft: 12, lineHeight: 1.4 }}>{payers.join(" + ")}</div>
          </div>
        )))}
        <div style={{ borderTop: `1px dashed ${PAPER.rule}`, marginTop: 8, paddingTop: 6 }}>
          <TicketLine left="Subtotal" right={fmtMoney(r.subtotal, dec)} />
          {r.discount && <TicketLine left={`Dcto ${r.discount.description}${r.discount.capped ? " (tope)" : ""}`} right={`-${fmtMoney(r.discount.amount, dec)}`} />}
          <TicketLine left={`Propina${r.tip.pct != null ? ` ${r.tip.pct}%` : ""}`} right={fmtMoney(r.tip.amount, dec)} />
          <TicketLine left="TOTAL" right={fmtMoney(r.total, dec)} bold />
        </div>
        <div style={{ borderTop: `1px dashed ${PAPER.rule}`, marginTop: 8, paddingTop: 6 }}>
          {r.people.map((p) => (
            <TicketLine key={p.name} left={p.is_payer ? `${p.name}  pago la cuenta` : p.name} right={p.is_payer ? fmtMoney(p.total, dec) : `debe ${fmtMoney(p.owes, dec)}`} bold={p.is_payer} />
          ))}
        </div>
        {data.emailed_to?.length > 0 && <div style={{ color: PAPER.soft, fontSize: 9.5, marginTop: 8 }}>excel enviado a {data.emailed_to.join(", ")}</div>}
      </Ticket>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {confirm ? (
          <>
            <Btn small ghost accent={T.ash} onClick={() => setConfirm(false)}>NO</Btn>
            <Btn small accent={T.ember} disabled={busy} onClick={() => onChange(() => api("DELETE", `/api/splitter/checks/${id}`))}>SI, BORRAR</Btn>
          </>
        ) : <Btn small ghost accent={T.ember} onClick={() => setConfirm(true)}>BORRAR CUENTA</Btn>}
      </div>
    </div>
  );
};

const CuentasTab = () => {
  const checks = useResource("/api/splitter/checks?limit=60");
  const [open, setOpen] = useState(null);
  if (checks.loading) return <Empty>cargando…</Empty>;
  if (checks.data === null) return <div style={{ padding: 14 }}><ErrorNote>{checks.error}</ErrorNote></div>;
  const rows = checks.data;
  return (
    <div style={{ padding: "14px 14px 26px" }} className="fadein">
      {rows.length === 0 ? (
        <Empty>AUN NO HAY CUENTAS · MANDALE UNA FOTO DE LA BOLETA AL AGENTE</Empty>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((c) => {
            const isOpen = open === c.id;
            const dec = decimalsOf(c.currency);
            const pending = c.shares.filter((s) => s.owes > 0 && !s.settled_at).length;
            return (
              <Card key={c.id} accent={isOpen ? T.copper : pending ? T.ember : T.sage}>
                <div onClick={() => setOpen(isOpen ? null : c.id)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: GROT, fontSize: 14, fontWeight: 700, color: T.bone }}>{c.restaurant || c.id}</div>
                    <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 15, color: T.copper }}>{fmtMoney(c.total, dec)}</div>
                  </div>
                  <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO, marginBottom: 8 }}>
                    {fmtDate(c.check_date)}{c.paid_by ? ` · pago ${c.paid_by}` : ""}{pending ? ` · ${pending} sin pagar` : " · todo pagado"}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {c.shares.map((s) => <Chip key={s.person_name} name={s.person_name} amount={s.owes} settled={!!s.settled_at} payer={s.person_name === c.paid_by} decimals={dec} />)}
                  </div>
                </div>
                {isOpen && <CheckTicket id={c.id} busy={checks.busy} onChange={(fn) => checks.run(fn).then(() => setOpen(null)).catch(() => {})} />}
                {isOpen && <ErrorNote>{checks.error}</ErrorNote>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB — PERSONAS: list, add, edit email/aliases, delete
// ═══════════════════════════════════════════════════════════════
const PersonRow = ({ p, people }) => {
  const [edit, setEdit] = useState(false);
  const [email, setEmail] = useState(p.email || "");
  const [aliases, setAliases] = useState(p.aliases.join(", "));
  const save = () => people.run(() => api("PATCH", `/api/splitter/people/${p.id}`, { email, aliases })).then(() => setEdit(false)).catch(() => {});
  return (
    <Card accent={Number(p.owes) > 0 ? T.ember : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: GROT, fontSize: 14, fontWeight: 700, color: T.bone }}>{p.name}</div>
          <div style={{ fontSize: 9, color: T.ash, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.checks} {p.checks === 1 ? "cuenta" : "cuentas"}{p.last_check ? ` · ultima ${fmtDate(p.last_check)}` : ""}{p.email ? ` · ${p.email}` : ""}{p.aliases.length ? ` · alias ${p.aliases.join(", ")}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {Number(p.owes) > 0 && <span style={{ fontFamily: GROT, fontWeight: 700, color: T.ember }}>{fmtMoney(p.owes)}</span>}
          <Btn small ghost accent={T.steel} onClick={() => setEdit(!edit)}>{edit ? "CERRAR" : "EDITAR"}</Btn>
        </div>
      </div>
      {edit && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 7 }}>
            <Field label="EMAIL" accent={T.steel} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" />
            <Field label="ALIAS (COMA)" accent={T.steel} value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="pepe, jose" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {p.checks === 0 ? <Btn small ghost accent={T.ember} disabled={people.busy} onClick={() => people.run(() => api("DELETE", `/api/splitter/people/${p.id}`)).catch(() => {})}>BORRAR</Btn> : <span />}
            <Btn small accent={T.steel} disabled={people.busy} onClick={save}>GUARDAR</Btn>
          </div>
        </div>
      )}
    </Card>
  );
};

const PersonasTab = () => {
  const people = useResource("/api/splitter/people");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  if (people.loading) return <Empty>cargando…</Empty>;
  if (people.data === null) return <div style={{ padding: 14 }}><ErrorNote>{people.error}</ErrorNote></div>;
  return (
    <div style={{ padding: "14px 14px 26px" }} className="fadein">
      <Card style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <Label color={T.steel}>// NUEVA_PERSONA</Label>
        <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
          <Field label="NOMBRE" accent={T.steel} value={name} onChange={(e) => setName(e.target.value)} placeholder="como la nombras en el chat" />
          <Field label="EMAIL" accent={T.steel} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" />
          <Btn accent={T.steel} disabled={!name.trim() || people.busy}
            onClick={() => people.run(() => api("POST", "/api/splitter/people", { name: name.trim(), email: email.trim() || null })).then(() => { setName(""); setEmail(""); }).catch(() => {})}>
            + AGREGAR
          </Btn>
        </div>
        <ErrorNote>{people.error}</ErrorNote>
      </Card>
      {people.data.length === 0 ? <Empty>SIN PERSONAS · EL AGENTE LAS CREA AL REPARTIR LA PRIMERA CUENTA</Empty> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {people.data.map((p) => <PersonRow key={p.id} p={p} people={people} />)}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB — AJUSTES: default payer and email recipients
// ═══════════════════════════════════════════════════════════════
const AjustesTab = ({ settings, onSaved }) => {
  const people = useResource("/api/splitter/people");
  const [payer, setPayer] = useState(settings?.default_payer || "");
  const [to, setTo] = useState((settings?.recipients?.to || []).join(", "));
  const [cc, setCc] = useState((settings?.recipients?.cc || []).join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setPayer(settings?.default_payer || ""); setTo((settings?.recipients?.to || []).join(", ")); setCc((settings?.recipients?.cc || []).join(", "));
  }, [settings]);
  if (!settings) return <Empty>cargando…</Empty>;
  const names = new Set((people.data || []).map((p) => p.name));
  if (payer && !names.has(payer)) names.add(payer);
  const save = async () => {
    setBusy(true); setError(null); setSaved(false);
    try { await api("PUT", "/api/splitter/settings", { default_payer: payer, recipients: { to, cc } }); setSaved(true); onSaved(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <div style={{ padding: "14px 14px 26px" }} className="fadein">
      <Card accent={T.copper} style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <Label color={T.copper}>// QUIEN_PAGA_LA_CUENTA</Label>
        <div style={{ fontSize: 10, color: T.ash, lineHeight: 1.6 }}>El agente propone esta persona como quien pago; los demas le deben su parte.</div>
        <select value={payer} onChange={(e) => setPayer(e.target.value)} style={{ ...inputStyle, borderColor: T.copper + "88" }}>
          {[...names].sort().map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </Card>
      <Card accent={T.steel} style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <Label color={T.steel}>// A_QUIEN_LLEGA_EL_EXCEL</Label>
        <Field label="PARA (COMA)" accent={T.steel} value={to} onChange={(e) => setTo(e.target.value)} placeholder="a@b.com, c@d.com" />
        <Field label="CC (COMA)" accent={T.steel} value={cc} onChange={(e) => setCc(e.target.value)} placeholder="opcional" />
      </Card>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
        {saved && <span style={{ fontSize: 9, color: T.sage, fontFamily: MONO, letterSpacing: 1 }}>GUARDADO</span>}
        <Btn accent={T.copper} disabled={busy || !payer || !to.trim()} onClick={save}>GUARDAR AJUSTES</Btn>
      </div>
      <ErrorNote>{error}</ErrorNote>
      <Card style={{ marginTop: 16 }}>
        <Label color={T.sage} style={{ marginBottom: 6 }}>// COMO_FUNCIONA</Label>
        <div style={{ fontSize: 11, color: T.bone, lineHeight: 1.8 }}>
          Mandale la foto de la boleta al agente Splitter desde la app de Claude.<br />
          Te pregunta quien tomo cada cosa, si hay descuento con tope, y quien pago.<br />
          Propina 10% sobre el subtotal, descuento repartido segun consumo.<br />
          El Excel llega a los emails de arriba. Aqui marcas quien ya te pago.
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
const TABS = [["saldos", "SALDOS"], ["cuentas", "CUENTAS"], ["personas", "PERSONAS"], ["ajustes", "AJUSTES"]];

export default function Splitter() {
  const [tab, setTab] = useState(TABS[0][0]);
  const [today, setToday] = useState(null);
  const settings = useResource("/api/splitter/settings");
  useEffect(() => { setToday(localDate()); }, []);

  return (
    <div style={{ fontFamily: MONO, background: T.bg, minHeight: "100vh", color: T.bone }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.bg}}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.line};border-radius:2px}
        button,input,select{font-family:inherit}
        input:focus,select:focus{border-color:${T.copper}!important}
        input::placeholder{color:${T.faint};font-weight:500}
        select option{background:${T.bg};color:${T.bone}}
        .fadein{animation:fi .3s ease}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ticket{border-radius:3px 3px 0 0;box-shadow:0 6px 18px rgba(0,0,0,.35)}
        .ticket::after{content:"";position:absolute;left:0;right:0;bottom:-7px;height:7px;
          background:linear-gradient(135deg,${PAPER.bg} 50%,transparent 50%) 0 0/14px 7px repeat-x,
                     linear-gradient(225deg,${PAPER.bg} 50%,transparent 50%) 7px 0/14px 7px repeat-x}
        @media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ padding: "18px 16px 0", borderBottom: `1px solid ${T.line}`, background: T.bg, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: 3, color: T.faint, marginBottom: 3 }}>// SPLITTER</div>
              <div style={{ fontFamily: GROT, fontSize: 24, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.5px", color: T.bone }}>
                CUENTAS<span style={{ color: T.copper }}>_</span>{settings.data?.default_payer || ""}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 9, color: T.ash, lineHeight: 1.6 }}>
              {today && <div>{fmtDate(today)}</div>}
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {TABS.map(([t, lbl]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, background: "none", border: "none", cursor: "pointer", padding: "9px 2px",
                fontSize: 9.5, letterSpacing: 1.5, transition: "all .2s",
                color: tab === t ? T.copper : T.faint,
                borderBottom: tab === t ? `2px solid ${T.copper}` : `2px solid transparent`,
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        <div key={tab}>
          {tab === "saldos" && <SaldosTab settings={settings.data} />}
          {tab === "cuentas" && <CuentasTab />}
          {tab === "personas" && <PersonasTab />}
          {tab === "ajustes" && <AjustesTab settings={settings.data} onSaved={settings.refresh} />}
        </div>

        <div style={{ padding: "10px 18px 26px", textAlign: "center", fontSize: 8, color: T.faint, letterSpacing: 2 }}>
          SPLITTER · AGENTE EN JFUBUNTU
        </div>
      </div>
    </div>
  );
}
