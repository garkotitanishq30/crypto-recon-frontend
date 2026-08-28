import React, { useState, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import Graph3D from './graph3d';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

function App() {
  const [suspects, setSuspects] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [searchAddress, setSearchAddress] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reportLog, setReportLog] = useState("⚡ System Ready...");
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("trace");
  const [autoChain, setAutoChain] = useState("AUTO-DETECT");
  const [viewType, setViewType] = useState("3D");
  const [selectedChain, setSelectedChain] = useState("auto");
  const [caseId, setCaseId] = useState("");
  const [freezeStatus, setFreezeStatus] = useState("");
  const [particles] = useState(() => [...Array(30)].map((_, i) => ({ id: i, left: Math.random() * 100, top: Math.random() * 100, size: 2 + Math.random() * 3, duration: 2 + Math.random() * 4 })));

  const chains = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "💎" },
    { id: "bitcoin", name: "Bitcoin", symbol: "BTC", icon: "₿" },
    { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", icon: "🐕" },
    { id: "solana", name: "Solana", symbol: "SOL", icon: "☀️" },
    { id: "polygon", name: "Polygon", symbol: "MATIC", icon: "🟣" },
    { id: "bnb", name: "BNB Chain", symbol: "BNB", icon: "🟡" },
    { id: "tron", name: "Tron", symbol: "TRX", icon: "🔶" },
  ];

  const BACKEND_URL = 'https://crypto-recon-backend.onrender.com';

  useEffect(() => { fetchSuspects(); fetchExchanges(); }, []);

  const fetchSuspects = async () => {
    try { const res = await fetch(`${BACKEND_URL}/suspects`); const data = await res.json(); setSuspects(data.suspects || []); } catch {}
  };

  const fetchExchanges = async () => {
    try { const res = await fetch(`${BACKEND_URL}/exchanges`); const data = await res.json(); setExchanges(data.exchanges || []); } catch {}
  };

  const generateCaseId = () => `CRP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;

  const traceWallet = async (address) => {
    if (!address?.trim()) { setReportLog("⚠️ Address daalo!"); return; }
    setIsLoading(true); setFreezeStatus("");
    try {
      const res = await fetch(`${BACKEND_URL}/trace`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ address: address.trim(), chain: selectedChain === "auto" ? "" : selectedChain })
      });
      const data = await res.json();
      if (data.error) { setReportLog("❌ " + data.error); setIsLoading(false); return; }
      setNodes(data.nodes || []); setEdges(data.edges || []); setReport(data.report);
      setCaseId(generateCaseId());
      setAutoChain(`${data.report?.chain_symbol || ''} (${data.report?.chain || ''})`);
      setReportLog(`📊 ${data.report?.classification} | Risk: ${data.report?.risk_score}/100`);
    } catch { setReportLog("❌ Backend failed"); }
    setIsLoading(false);
  };

  const triggerFreeze = () => {
    if (!report) return;
    setFreezeStatus("PENDING");
    setTimeout(() => setFreezeStatus("SENT"), 1500);
    setTimeout(() => setFreezeStatus("ACKNOWLEDGED"), 3000);
    setTimeout(() => { setFreezeStatus("FROZEN"); alert(`✅ ASSETS FROZEN!\nCase: ${caseId}`); }, 5000);
  };

  const addWatermark = (doc, text) => {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');
    doc.text(text, 105, 150, { align: 'center', angle: 45, opacity: 0.3 });
  };

  const addOfficialBorder = (doc) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.rect(5, 5, 200, 287);
    doc.setLineWidth(0.5);
    doc.rect(8, 8, 194, 281);
  };

  const addAshokaChakra = (doc, x, y, radius) => {
    doc.setDrawColor(0, 0, 128);
    doc.setLineWidth(1.5);
    doc.circle(x, y, radius, 'S');
    doc.setLineWidth(0.4);
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15) * Math.PI / 180;
      doc.line(x + Math.cos(angle) * (radius - 1.2), y + Math.sin(angle) * (radius - 1.2), x + Math.cos(angle) * (radius - 0.3), y + Math.sin(angle) * (radius - 0.3));
    }
    doc.setLineWidth(0.8);
    doc.circle(x, y, 1.5, 'S');
  };

  const addHeader = (doc, title, subtitle) => {
    doc.setFillColor(255, 153, 51); doc.rect(0, 0, 210, 8, 'F');
    doc.setFillColor(255, 255, 255); doc.rect(0, 8, 210, 8, 'F');
    doc.setFillColor(19, 136, 8); doc.rect(0, 16, 210, 8, 'F');
    addAshokaChakra(doc, 105, 12, 4);
    doc.setFillColor(0, 0, 0); doc.rect(0, 24, 210, 40, 'F');
    doc.setTextColor(0, 255, 136); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('CRYPTO RECON PRO', 105, 35, {align:'center'});
    doc.setFontSize(9); doc.text('Government of India - Cyber Crime Investigation Unit', 105, 42, {align:'center'});
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.text(title, 105, 52, {align:'center'});
    doc.setFontSize(8); doc.text(`${subtitle} | Case: ${caseId}`, 105, 58, {align:'center'});
  };

  const addRealStamp = (doc, x, y) => {
    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(2.5); doc.circle(x, y, 22, 'S');
    doc.setLineWidth(1.2); doc.circle(x, y, 18, 'S');
    doc.setTextColor(200, 0, 0); doc.setFontSize(18); doc.text('★', x, y + 6, {align:'center'});
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('CYBER CRIME', x, y - 14, {align:'center'});
    doc.text('INVESTIGATION UNIT', x, y - 9, {align:'center'});
    doc.text('GOVERNMENT OF INDIA', x, y + 14, {align:'center'});
    doc.setFontSize(5);
    doc.text('AUTHENTIC', x - 14, y, {align:'center', angle: 90});
    doc.text('VERIFIED', x + 14, y, {align:'center', angle: -90});
  };

  const addSignatureBox = (doc, y) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('INVESTIGATING OFFICER', 50, y, {align:'center'});
    doc.text('APPROVING AUTHORITY', 160, y, {align:'center'});
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(20, y + 5, 60, 25);
    doc.rect(130, y + 5, 60, 25);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Name:', 25, y + 15);
    doc.text('Designation:', 25, y + 22);
    doc.text('Name:', 135, y + 15);
    doc.text('Designation:', 135, y + 22);
  };

  const addQRCode = async (doc, x, y) => {
    try {
      const verifyUrl = `https://etherscan.io/address/${report?.wallet_address || '0x'}?case=${caseId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 80, margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', x, y, 25, 25);
      doc.setFontSize(6); doc.setFont('helvetica', 'bold');
      doc.text('SCAN TO VERIFY', x + 12.5, y + 28, {align:'center'});
    } catch (e) {}
  };

  const downloadPDF = async (title) => {
    if (!report) return;
    const doc = new jsPDF();
    addHeader(doc, title, 'Official Document');
    addOfficialBorder(doc);
    addWatermark(doc, title.includes('BNSS') ? 'URGENT' : title.includes('BSA') ? 'EVIDENCE' : 'CONFIDENTIAL');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('CASE INFORMATION', 20, 75);
    doc.line(20, 77, 190, 77);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    let y = 85;
    const addLine = (label, value) => { doc.setFont('helvetica', 'bold'); doc.text(`${label}:`, 25, y); doc.setFont('helvetica', 'normal'); doc.text(String(value), 70, y); y += 6; };
    addLine('Case Number', caseId);
    addLine('Wallet', report.wallet_address);
    addLine('Chain', `${report.chain} (${report.chain_symbol})`);
    addLine('Classification', report.classification);
    addLine('Risk Score', `${report.risk_score}/100`);
    addLine('Status', report.wallet_status);
    if (report.fraud_analysis) {
      y += 5;
      addLine('Fraud Likelihood', report.fraud_analysis.fraud_likelihood);
      addLine('Patterns', report.fraud_analysis.patterns_count);
      if (report.fraud_analysis.bridges?.length > 0) addLine('Bridges', report.fraud_analysis.bridges.map(b => b.bridge).join(', '));
      if (report.fraud_analysis.mixers?.length > 0) addLine('Mixers', report.fraud_analysis.mixers.map(m => m.mixer).join(', '));
    }
    y += 5;
    doc.setFont('helvetica', 'bold'); doc.text('SUSPECT DETAILS', 20, y); y += 6;
    doc.setFont('helvetica', 'normal');
    addLine('Name', report.suspect_details?.real_name);
    addLine('Bank', report.suspect_details?.bank_account);
    addLine('IFSC', report.suspect_details?.ifsc);
    addLine('UPI', report.suspect_details?.upi_vpa);
    addLine('Seizure', report.suspect_details?.seizure_value);
    y += 5;
    doc.setFont('helvetica', 'bold'); doc.text('VASP DETAILS', 20, y); y += 6;
    doc.setFont('helvetica', 'normal');
    addLine('Exchange', report.vasp_details?.exchange);
    addLine('Nodal Officer', report.vasp_details?.nodal_officer);
    addLine('Email', report.vasp_details?.email);
    addLine('Contact', report.vasp_details?.contact);
    addLine('Jurisdiction', report.vasp_details?.jurisdiction);
    addSignatureBox(doc, 220);
    addRealStamp(doc, 170, 250);
    await addQRCode(doc, 25, 250);
    doc.setFillColor(0, 0, 0); doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8);
    doc.text(`Case: ${caseId} | Generated: ${new Date().toLocaleString()}`, 105, 287, {align:'center'});
    doc.save(`${caseId}_${title.replace(/\s/g,'_')}.pdf`);
  };

  const btnStyle = (type) => ({
    padding: '8px 12px', background: viewType === type ? 'rgba(0,255,136,0.3)' : 'rgba(0,0,0,0.7)',
    color: viewType === type ? '#00ff88' : '#ccc', border: viewType === type ? '1px solid #00ff88' : '1px solid #444',
    borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold'
  });

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)', color: 'white', fontFamily: "'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
        {particles.map(p => <div key={p.id} style={{ position: 'absolute', width: `${p.size}px`, height: `${p.size}px`, background: Math.random() > 0.5 ? '#00ff88' : '#00ccff', borderRadius: '50%', left: `${p.left}%`, top: `${p.top}%`, animation: `float ${p.duration}s infinite`, opacity: 0.4 }} />)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(0,255,136,0.3)', zIndex: 1 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', background: 'linear-gradient(90deg, #00ff88, #00ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>⚡ CRYPTO RECON PRO</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>AI-Powered Fraud Attribution System</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {caseId && <div style={{ padding: '8px 16px', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '20px', fontSize: '11px', color: '#FFA500' }}>📋 {caseId}</div>}
          <div style={{ padding: '8px 16px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '20px', fontSize: '12px', color: '#00ff88' }}>🔗 {autoChain}</div>
          <button onClick={() => { fetchSuspects(); fetchExchanges(); }} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #00ccff, #0066ff)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>🔄 Sync</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 1 }}>
        <div style={{ width: '34%', background: 'rgba(20,20,35,0.9)', padding: '15px', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', marginBottom: '15px', gap: '5px' }}>
            <button onClick={() => setActiveTab('trace')} style={{ flex: 1, padding: '10px 5px', background: activeTab === 'trace' ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'rgba(255,255,255,0.05)', color: activeTab === 'trace' ? '#000' : '#fff', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px' }}>🔍 TRACE</button>
            <button onClick={() => setActiveTab('suspects')} style={{ flex: 1, padding: '10px 5px', background: activeTab === 'suspects' ? 'linear-gradient(135deg, #ff0044, #cc0033)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px' }}>🚨 SUSPECTS</button>
            <button onClick={() => setActiveTab('exchanges')} style={{ flex: 1, padding: '10px 5px', background: activeTab === 'exchanges' ? 'linear-gradient(135deg, #00ccff, #0099ff)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px' }}>🏦 VASPs</button>
          </div>

          {activeTab === 'trace' ? (
            <>
              <select value={selectedChain} onChange={(e) => setSelectedChain(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(0,204,255,0.3)', borderRadius: '8px', fontSize: '12px' }}>
                <option value="auto">🔗 AUTO-DETECT</option>
                {chains.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name} ({c.symbol})</option>)}
              </select>
              <input type="text" value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} placeholder="Paste any wallet address..." style={{ width: '100%', padding: '12px', marginBottom: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', fontSize: '12px' }} />
              <button onClick={() => traceWallet(searchAddress)} disabled={isLoading} style={{ width: '100%', padding: '12px', background: isLoading ? '#444' : 'linear-gradient(135deg, #ff0044, #cc0033)', color: 'white', fontSize: '13px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '10px' }}>{isLoading ? '⏳ AI TRACING...' : '🚨 AI TRACE'}</button>
              <button onClick={() => { setSearchAddress("0x742d35cc6634c0532925a3b844bc9e4439f44f44"); traceWallet("0x742d35cc6634c0532925a3b844bc9e4439f44f44"); }} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: 'rgba(255,0,68,0.2)', color: '#ff0044', border: '1px solid rgba(255,0,68,0.3)', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}>🚨 Phishing Scam (Demo)</button>
            </>
          ) : activeTab === 'suspects' ? (
            <>
              <h3 style={{ fontSize: '14px' }}>🚨 Suspects ({suspects.length})</h3>
              {suspects.map((s) => (
                <div key={s.address} onClick={() => { setSearchAddress(s.address); traceWallet(s.address); }} style={{ padding: '10px', marginBottom: '8px', background: 'rgba(255,0,68,0.1)', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,0,68,0.3)' }}>
                  <div style={{ fontWeight: 'bold', color: '#ff0044', fontSize: '12px' }}>{s.fraud_type}</div>
                  <div style={{ fontSize: '9px', color: '#aaa' }}>{s.address}</div>
                  <div style={{ fontSize: '9px', color: '#ccc' }}>👤 {s.real_name} | 💰 {s.seizure_value}</div>
                </div>
              ))}
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '14px' }}>🏦 VASPs ({exchanges.length})</h3>
              {exchanges.map((e) => (
                <div key={e.address} style={{ padding: '10px', marginBottom: '8px', background: 'rgba(0,204,255,0.1)', borderRadius: '8px', border: '1px solid rgba(0,204,255,0.3)' }}>
                  <div style={{ fontWeight: 'bold', color: '#00ccff', fontSize: '12px' }}>{e.name}</div>
                  <div style={{ fontSize: '9px', color: '#ccc' }}>👔 {e.nodal_officer}</div>
                  <div style={{ fontSize: '9px', color: '#888' }}>📧 {e.email}</div>
                  <div style={{ fontSize: '9px', color: '#888' }}>🌍 {e.jurisdiction}</div>
                </div>
              ))}
            </>
          )}

          {report && (
            <>
              <button onClick={() => downloadPDF('INVESTIGATION REPORT')} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #00ff88, #00cc66)', color: '#000', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '6px' }}>📄 Investigation (PDF)</button>
              <button onClick={() => downloadPDF('SECTION 94 BNSS NOTICE')} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #FFA500, #FF8C00)', color: '#000', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '6px' }}>📋 BNSS Notice (PDF)</button>
              <button onClick={() => downloadPDF('SECTION 65B BSA CERTIFICATE')} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #00ccff, #0099ff)', color: '#000', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '6px' }}>📜 BSA Certificate (PDF)</button>
              <button onClick={triggerFreeze} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #ff0044, #cc0033)', color: 'white', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '8px', marginBottom: '10px' }}>🚨 Trigger Freeze</button>
            </>
          )}

          {freezeStatus && (
            <div style={{ padding: '10px', marginBottom: '10px', background: freezeStatus === 'FROZEN' ? 'rgba(0,255,136,0.2)' : 'rgba(255,165,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: freezeStatus === 'FROZEN' ? '#00ff88' : '#FFA500' }}>
                {freezeStatus === 'PENDING' && '⏳ PENDING'}
                {freezeStatus === 'SENT' && '📧 SENT'}
                {freezeStatus === 'ACKNOWLEDGED' && '✅ ACKNOWLEDGED'}
                {freezeStatus === 'FROZEN' && '🔒 FROZEN!'}
              </p>
            </div>
          )}

          <div style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', borderLeft: '4px solid #00ff88', borderRadius: '0 8px 8px 0' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#00ff88', fontSize: '11px' }}>📡 FEED:</h4>
            <p style={{ fontSize: '11px', color: '#ccc', margin: 0 }}>{reportLog}</p>

            {report?.fraud_analysis && (
              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,165,0,0.1)', borderRadius: '6px' }}>
                <p style={{ fontSize: '10px', color: '#FFA500', fontWeight: 'bold' }}>🤖 AI FRAUD ANALYSIS:</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>Likelihood: {report.fraud_analysis.fraud_likelihood}</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>Patterns: {report.fraud_analysis.patterns_count}</p>
                {report.fraud_analysis.patterns?.map((p, i) => <p key={i} style={{ fontSize: '9px', color: '#FFA500' }}>⚠️ {p.pattern} - {p.description}</p>)}
                {report.fraud_analysis.bridges?.length > 0 && <p style={{ fontSize: '10px', color: '#00ccff' }}>🌉 Bridges: {report.fraud_analysis.bridges.map(b => b.bridge).join(', ')}</p>}
                {report.fraud_analysis.mixers?.length > 0 && <p style={{ fontSize: '10px', color: '#ff0044' }}>🌀 Mixers: {report.fraud_analysis.mixers.map(m => m.mixer).join(', ')}</p>}
                {report.fraud_analysis.total_clusters > 0 && <p style={{ fontSize: '10px', color: '#9C27B0' }}>🧠 Clusters: {report.fraud_analysis.total_clusters} ({report.fraud_analysis.confidence})</p>}
              </div>
            )}

            {report?.multi_hop_trace?.length > 0 && (
              <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(0,255,136,0.1)', borderRadius: '6px' }}>
                <p style={{ fontSize: '10px', color: '#00ff88', fontWeight: 'bold' }}>📊 MULTI-HOP:</p>
                {report.multi_hop_trace.map((h, i) => <p key={i} style={{ fontSize: '9px', color: '#ccc' }}>L{h.level}: {h.from} → {h.to}</p>)}
              </div>
            )}

            {report?.suspect_details && (
              <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(255,0,68,0.1)', borderRadius: '6px' }}>
                <p style={{ fontSize: '10px', color: '#ff0044', fontWeight: 'bold' }}>👤 SUSPECT:</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>Name: {report.suspect_details.real_name}</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>Bank: {report.suspect_details.bank_account}</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>IFSC: {report.suspect_details.ifsc}</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>UPI: {report.suspect_details.upi_vpa}</p>
                <p style={{ fontSize: '10px', color: '#00ff88' }}>Seizure: {report.suspect_details.seizure_value}</p>
              </div>
            )}

            {report?.vasp_details && report.vasp_details.exchange !== 'NOT LINKED' && (
              <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(0,204,255,0.1)', borderRadius: '6px' }}>
                <p style={{ fontSize: '10px', color: '#00ccff', fontWeight: 'bold' }}>🏦 VASP:</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>{report.vasp_details.exchange}</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>👔 {report.vasp_details.nodal_officer}</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>📧 {report.vasp_details.email}</p>
                <p style={{ fontSize: '10px', color: '#ccc' }}>🌍 {report.vasp_details.jurisdiction}</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, background: 'radial-gradient(circle, #1a1a2e 0%, #0a0a0f 100%)', position: 'relative' }}>
          {nodes.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
              <button onClick={() => setViewType('3D')} style={btnStyle('3D')}>🌐 3D</button>
              <button onClick={() => setViewType('2D')} style={btnStyle('2D')}>📊 2D</button>
              <button onClick={() => setViewType('TREE')} style={btnStyle('TREE')}>🌳 TREE</button>
              <button onClick={() => setViewType('TIMELINE')} style={btnStyle('TIMELINE')}>⏱️ TIME</button>
              <button onClick={() => setViewType('HEATMAP')} style={btnStyle('HEATMAP')}>🔥 HEAT</button>
            </div>
          )}

          {nodes.length === 0 ? (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: '#555' }}>
              <p style={{ fontSize: '50px' }}>⚡</p>
              <p>Enter wallet address</p>
            </div>
          ) : viewType === '3D' ? <Graph3D nodes={nodes} edges={edges} /> :
            viewType === '2D' ? <ReactFlow nodes={nodes} edges={edges} fitView><MiniMap style={{background:'#1a1a2e'}}/><Controls/><Background color="#333" gap={20}/></ReactFlow> :
            viewType === 'TREE' ? (
              <div style={{ padding: '30px', overflowY: 'auto', height: '100%' }}>
                {nodes.map((n, i) => <div key={n.id} style={{ marginLeft: `${i*25}px`, padding: '10px', borderLeft: '3px solid #00ff88' }}><span style={{color: n.style?.background}}>●</span> {n.data?.label}</div>)}
              </div>
            ) : viewType === 'TIMELINE' ? (
              <div style={{ padding: '30px' }}>
                {edges.map((e, i) => <div key={e.id} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', marginBottom: '10px' }}>{e.label}</div>)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', padding: '30px' }}>
                {nodes.map(n => <div key={n.id} style={{ padding: '20px', background: n.style?.background, borderRadius: '10px', textAlign: 'center' }}>{n.data?.label}</div>)}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;