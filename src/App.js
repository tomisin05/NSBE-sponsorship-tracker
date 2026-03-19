import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

const COMPANIES = [
  "3M", "ABB, Inc.", "Abbott", "Accenture", "ACTS", "AECOM", "Air Products", "Airbus",
  "Amazon", "Apple", "Arcadis", "Arconic", "Arup US Inc.",
  "AstraZeneca Pharmaceuticals LP", "Barnes Group", "Bechtel",
  "Bentley Systems, Inc.", "Black Blockchain Labs", "Blue Origin", "BNY Mellon",
  "Bohler Engineering", "Bridgestone Americas", "Bristol-Myers Squibb", "Burns & McDonnell",
  "BW Energy", "Cadence Design Systems, Inc.", "Capital One, Inc.", "Cargill, Incorporated",
  "Caterpillar Inc.", "CFD Research Corporation", "Chevron", "Clorox", "Cognex",
  "ConocoPhillips", "Constellation Energy", "Cook Medical Holdings, Inc.", "Cummins, Inc.",
  "Dairy Farmers of America", "Dauch Corporation", "Dell Technologies",
  "Deloitte", "Delta Air Lines, Inc.", "Dodge Industrial, Inc.",
  "DPR Construction", "Draper", "Duracell", "Eaton Corporation",
  "Edwards Lifesciences, LLC", "Ernst & Young LLP", "ESRI", "Estee Lauder Companies",
  "Exelon", "ExxonMobil", "Fish & Richardson P.C.", "FM Global", "Fonteva",
  "Ford Motor Company", "Freeport-McMoRan Inc.", "GAF", "GE Aerospace", "GE Healthcare",
  "GE Vernova", "General Dynamics, Inc.", "General Motors", "GHD",
  "Gilbane Building Company", "Givelify", "Goldman Sachs", "Granite Construction",
  "Hensel Phelps", "Hilti", "Honeywell", "IBM", "Intel Corporation", "IQT", "Jabil Inc.",
  "Jacobs", "John Deere", "Johnson & Johnson", "Kiewit", "KLA", "L'Oreal",
  "Lam Research Corporation", "Lenovo", "Linde", "Lockheed Martin Corporation",
  "Los Angeles Department of Water and Power", "Marvell Technology", "MathWorks",
  "McCarthy Building Companies", "Medtronic", "Merck & Co., Inc.",
  "Michigan Department of Transportation", "Micron", "Microsoft, Inc.",
  "Morgan Stanley", "Mortenson Construction", "New York Independent System Operator",
  "Nintendo of America, Inc.", "Northrop Grumman", "Nucor Corporation", "NVIDIA",
  "Pacific Gas and Electric Company", "PBF Energy", "PepsiCo, Inc.", "Perdue Farms",
  "Pfizer, Inc.", "Ramboll", "Raytheon Systems", "Rockwell Automation",
  "Sandia National Laboratories", "Schneider Electric", "Siemens, Inc.", "Sirius XM Radio",
  "Skanska", "SMART Scholarship For Service Program", "Smurfit Westrock",
  "Southern Company", "Southwire Company, Inc.", "SpaceX", "SSOE Group", "Swinerton",
  "Target Corporation", "TE Connectivity", "Teledyne Technologies",
  "Terracon Consultants, Inc.", "Texas Department of Transportation", "Texas Instruments",
  "The Whiting-Turner Contracting Company", "Toyota", "Trane Technologies, Inc.",
  "Trimble, Inc.", "Turner Construction", "UL Standards and Enterprise",
  "United Airlines", "United Parcel Service (UPS)",
  "Universal Destinations & Experiences", "United States Postal Service (USPS)",
  "USAA", "Vetex Pharmaceuticals", "Wabtec Corporation", "Walter P. Moore",
  "Wells Fargo", "Westinghouse Electric Company", "Worley", "WSP USA, Inc.",
].sort();

const FIELDS = [
  { key: "sponsors_opt", label: "Sponsors OPT", short: "OPT", icon: "✅", color: "#22c55e" },
  { key: "sponsors_cpt", label: "Sponsors CPT", short: "CPT", icon: "📋", color: "#3b82f6" },
  { key: "requires_work_auth", label: "Requires Work Authorization", short: "Work Auth", icon: "🔒", color: "#f59e0b" },
  { key: "requires_citizenship", label: "Requires U.S. Citizenship", short: "Citizenship", icon: "🇺🇸", color: "#ef4444" },
  { key: "requires_advanced_degree", label: "Requires Advanced Degree to Sponsor (MS/PhD)", short: "MS/PhD", icon: "🎓", color: "#8b5cf6" },
  { key: "does_not_sponsor", label: "Does Not Sponsor", short: "No Sponsor", icon: "❌", color: "#f43f5e" },
  { key: "offering_interviews", label: "Offering In-Person Interviews", short: "Interviews", icon: "🤝", color: "#06b6d4" },
];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function App() {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [checkboxes, setCheckboxes] = useState(
    Object.fromEntries(FIELDS.map(f => [f.key, false]))
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [error, setError] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [tableFilter, setTableFilter] = useState("");
  const [sponsorFilter, setSponsorFilter] = useState("");

  useEffect(() => {
    if (activeTab !== "overview") return;
    supabase.from("reports").select("*").then(({ data }) => {
      if (data) setAllReports(data);
    });
  }, [activeTab]);

  // Aggregate all reports by company
  const companyMap = {};
  allReports.forEach(r => {
    if (!companyMap[r.company]) companyMap[r.company] = { count: 0 };
    companyMap[r.company].count++;
    FIELDS.forEach(f => {
      if (r[f.key]) companyMap[r.company][f.key] = true;
    });
  });

  const tableRows = Object.entries(companyMap)
    .filter(([name]) => name.toLowerCase().includes(tableFilter.toLowerCase()))
    .filter(([, data]) => !sponsorFilter || data[sponsorFilter])
    .sort((a, b) => a[0].localeCompare(b[0]));

  const filtered = COMPANIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const loadEntries = useCallback(async (company) => {
    if (!company) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("company", company)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Could not load reports. Check your connection.");
      setEntries([]);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadEntries(selectedCompany);
      setSubmitted(false);
      setShowForm(false);
    }
  }, [selectedCompany, loadEntries]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedCompany) return;
    const channel = supabase
      .channel("reports-changes")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reports",
        filter: `company=eq.${selectedCompany}`,
      }, (payload) => {
        setEntries(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedCompany]);

  const handleSelect = (company) => {
    setSelectedCompany(company);
    setSearch(company);
    setShowDropdown(false);
    setCheckboxes(Object.fromEntries(FIELDS.map(f => [f.key, false])));
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!selectedCompany) return;
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from("reports").insert([{
      company: selectedCompany,
      ...checkboxes,
      notes: notes.trim() || null,
    }]);

    if (error) {
      setError("Failed to save. Please try again.");
    } else {
      setSubmitted(true);
      setShowForm(false);
      setCheckboxes(Object.fromEntries(FIELDS.map(f => [f.key, false])));
      setNotes("");
      loadEntries(selectedCompany);
    }
    setSubmitting(false);
  };

  const summary = {};
  FIELDS.forEach(f => {
    const trueCount = entries.filter(e => e[f.key]).length;
    summary[f.key] = { trueCount, total: entries.length };
  });

  const cardStyle = {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 12,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d1117",
      color: "#e6edf3",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      paddingBottom: 60,
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0a3622 0%, #0d1117 60%)",
        borderBottom: "1px solid #1a472a",
        padding: "24px 20px 20px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#3fb950", fontWeight: 700, marginBottom: 6 }}>
          NSBE 2026 BALTIMORE · CAREER FAIR
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
          International Student<br />Sponsorship Tracker
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "#8b949e", lineHeight: 1.5 }}>
          Crowdsourced by NSBE students · Live updates in real-time
        </p>
        <div style={{
          display: "inline-block", marginTop: 10,
          background: "#1a472a", borderRadius: 20, padding: "4px 12px",
          fontSize: 11, color: "#3fb950", fontWeight: 600,
        }}>
          {COMPANIES.length} companies tracked
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #21262d", background: "#161b22" }}>
        {[
          { id: "browse", label: "🔍 Look Up Company" },
          { id: "overview", label: "📊 All Companies" },
          { id: "how", label: "📖 How to Use" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
            background: "transparent", fontSize: 13, fontWeight: 600,
            color: activeTab === tab.id ? "#3fb950" : "#8b949e",
            borderBottom: activeTab === tab.id ? "2px solid #3fb950" : "2px solid transparent",
            transition: "all 0.2s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px" }}>

        {activeTab === "overview" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <input
                value={tableFilter}
                onChange={e => setTableFilter(e.target.value)}
                placeholder="Filter by company..."
                style={{
                  flex: 1, minWidth: 160, padding: "9px 14px", borderRadius: 8,
                  border: "1px solid #30363d", background: "#161b22",
                  color: "#e6edf3", fontSize: 13, outline: "none",
                }}
              />
              <select
                value={sponsorFilter}
                onChange={e => setSponsorFilter(e.target.value)}
                style={{
                  padding: "9px 12px", borderRadius: 8,
                  border: "1px solid #30363d", background: "#161b22",
                  color: sponsorFilter ? "#e6edf3" : "#8b949e", fontSize: 13, outline: "none",
                }}
              >
                <option value="">All statuses</option>
                {FIELDS.map(f => (
                  <option key={f.key} value={f.key}>{f.icon} {f.label}</option>
                ))}
              </select>
            </div>

            {tableRows.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#8b949e", fontSize: 14 }}>
                {allReports.length === 0 ? "No reports submitted yet." : "No companies match your filters."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #30363d" }}>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: "#8b949e", fontWeight: 700, whiteSpace: "nowrap" }}>Company</th>
                      <th style={{ textAlign: "center", padding: "8px 6px", color: "#8b949e", fontWeight: 700 }}>#</th>
                      {FIELDS.map(f => (
                        <th key={f.key} style={{ textAlign: "center", padding: "8px 6px", color: f.color, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {f.short}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(([name, data]) => (
                      <tr
                        key={name}
                        onClick={() => { handleSelect(name); setActiveTab("browse"); }}
                        style={{ borderBottom: "1px solid #21262d", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#161b22"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "9px 10px", color: "#e6edf3", fontWeight: 600, whiteSpace: "nowrap" }}>{name}</td>
                        <td style={{ textAlign: "center", padding: "9px 6px", color: "#8b949e" }}>{data.count}</td>
                        {FIELDS.map(f => (
                          <td key={f.key} style={{ textAlign: "center", padding: "9px 6px" }}>
                            {data[f.key]
                              ? <span style={{ color: f.color, fontSize: 14 }}>●</span>
                              : <span style={{ color: "#30363d", fontSize: 14 }}>○</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 11, color: "#8b949e", textAlign: "center" }}>
              Showing {tableRows.length} companies with reports · Click a row to view details
            </div>
          </div>
        )}

        {activeTab === "how" && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 12px", color: "#3fb950", fontSize: 15 }}>How This Works</h3>
              <ol style={{ margin: 0, padding: "0 0 0 18px", fontSize: 13, color: "#8b949e", lineHeight: 2 }}>
                <li>Visit a company's booth at the career fair</li>
                <li>Ask the recruiter about sponsorship for international students</li>
                <li>Come back here, search for that company</li>
                <li>Click <strong style={{ color: "#e6edf3" }}>"Add My Report"</strong> and check what applies</li>
                <li>Hit Submit — your info is instantly visible to everyone!</li>
              </ol>
            </div>
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 12px", color: "#f0883e", fontSize: 15 }}>Questions to Ask Recruiters</h3>
              <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 13, color: "#8b949e", lineHeight: 2.2 }}>
                <li>"Do you sponsor H-1B visas for new graduates?"</li>
                <li>"Can international students on OPT apply for full-time roles?"</li>
                <li>"Do you sponsor CPT for internships?"</li>
                <li>"Is U.S. citizenship or clearance required for these roles?"</li>
                <li>"Do you require a Master's or PhD to sponsor?"</li>
                <li>"Are you conducting interviews at the conference today?"</li>
              </ul>
            </div>
            <div style={{ ...cardStyle, borderColor: "#1a472a", background: "#0a1f0f" }}>
              <div style={{ fontSize: 12, color: "#3fb950", fontWeight: 700, marginBottom: 6 }}>⚠️ IMPORTANT NOTE</div>
              <p style={{ margin: 0, fontSize: 12, color: "#8b949e", lineHeight: 1.6 }}>
                This is crowdsourced student data — always verify directly with recruiters.
                Sponsorship policies can change. When multiple entries exist, look at the most recent one.
              </p>
            </div>
          </div>
        )}

        {activeTab === "browse" && (
          <div>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#8b949e", marginBottom: 6, letterSpacing: 1 }}>
                SEARCH COMPANY
              </label>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelectedCompany(""); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type company name..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 16px", borderRadius: 10,
                  border: "1px solid #30363d", background: "#161b22",
                  color: "#e6edf3", fontSize: 15, outline: "none",
                }}
              />
              {showDropdown && search && filtered.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0,
                  background: "#1c2128", border: "1px solid #30363d",
                  borderRadius: 10, zIndex: 100, maxHeight: 220, overflowY: "auto",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}>
                  {filtered.slice(0, 20).map(c => (
                    <div key={c} onClick={() => handleSelect(c)} style={{
                      padding: "10px 16px", cursor: "pointer", fontSize: 14,
                      borderBottom: "1px solid #21262d",
                      color: c === selectedCompany ? "#3fb950" : "#e6edf3",
                      background: c === selectedCompany ? "#0a3622" : "transparent",
                    }}>
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{
                background: "#2d1b1b", border: "1px solid #f43f5e44",
                borderRadius: 10, padding: "10px 14px", marginBottom: 14,
                fontSize: 13, color: "#f43f5e",
              }}>
                ⚠️ {error}
              </div>
            )}

            {selectedCompany && (
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
                }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{selectedCompany}</div>
                    <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>
                      {loading ? "Loading..." : `${entries.length} report${entries.length !== 1 ? "s" : ""} submitted`}
                    </div>
                  </div>
                  <button onClick={() => { setShowForm(!showForm); setSubmitted(false); }} style={{
                    background: showForm ? "#21262d" : "#238636",
                    border: "1px solid " + (showForm ? "#30363d" : "#2ea043"),
                    color: "#fff", borderRadius: 8, padding: "8px 16px",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>
                    {showForm ? "✕ Cancel" : "+ Add My Report"}
                  </button>
                </div>

                {submitted && (
                  <div style={{
                    background: "#0a3622", border: "1px solid #2ea043",
                    borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                    fontSize: 13, color: "#3fb950", fontWeight: 600,
                  }}>
                    ✅ Thanks! Your report has been saved and shared with all students.
                  </div>
                )}

                {/* Aggregate Summary */}
                {entries.length > 0 && !showForm && (
                  <div style={{ ...cardStyle, background: "#0d1117" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8b949e", letterSpacing: 1, marginBottom: 12 }}>
                      AGGREGATE SUMMARY ({entries.length} {entries.length === 1 ? "report" : "reports"})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {FIELDS.map(f => {
                        const { trueCount, total } = summary[f.key];
                        if (trueCount === 0) return null;
                        const pct = Math.round((trueCount / total) * 100);
                        return (
                          <div key={f.key} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: f.color + "15", border: `1px solid ${f.color}40`,
                            borderRadius: 20, padding: "4px 10px", fontSize: 12,
                          }}>
                            <span>{f.icon}</span>
                            <span style={{ color: f.color, fontWeight: 700 }}>{f.label}</span>
                            <span style={{
                              background: f.color + "30", borderRadius: 10,
                              padding: "1px 6px", fontWeight: 800, color: f.color, fontSize: 11,
                            }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {entries.length === 0 && !showForm && !loading && (
                  <div style={{ ...cardStyle, textAlign: "center", padding: "32px 20px", color: "#8b949e" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🏕️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3", marginBottom: 4 }}>
                      No reports yet for {selectedCompany}
                    </div>
                    <div style={{ fontSize: 12 }}>Be the first to visit their booth and report back!</div>
                  </div>
                )}

                {/* Form */}
                {showForm && (
                  <div style={cardStyle}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3", marginBottom: 14 }}>
                      Your Report for {selectedCompany}
                    </div>
                    {FIELDS.map(f => (
                      <label key={f.key} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
                        background: checkboxes[f.key] ? f.color + "12" : "#0d1117",
                        border: `1px solid ${checkboxes[f.key] ? f.color + "55" : "#21262d"}`,
                        transition: "all 0.15s",
                      }}>
                        <input
                          type="checkbox"
                          checked={checkboxes[f.key]}
                          onChange={e => setCheckboxes(prev => ({ ...prev, [f.key]: e.target.checked }))}
                          style={{ width: 16, height: 16, accentColor: f.color, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 16 }}>{f.icon}</span>
                        <span style={{
                          fontSize: 13, fontWeight: 600,
                          color: checkboxes[f.key] ? f.color : "#8b949e",
                        }}>{f.label}</span>
                      </label>
                    ))}
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#8b949e", display: "block", marginBottom: 6 }}>
                        ADDITIONAL NOTES (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder='"Recruiter said they only sponsor roles in TX" or "Spoke with Sarah, very helpful!"'
                        rows={3}
                        style={{
                          width: "100%", boxSizing: "border-box",
                          background: "#0d1117", border: "1px solid #30363d",
                          borderRadius: 8, color: "#e6edf3", fontSize: 13,
                          padding: "10px 12px", resize: "vertical", fontFamily: "inherit",
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{
                        marginTop: 14, width: "100%",
                        background: submitting ? "#21262d" : "#238636",
                        border: "1px solid " + (submitting ? "#30363d" : "#2ea043"),
                        color: "#fff", borderRadius: 8, padding: "12px",
                        fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                      }}
                    >
                      {submitting ? "Saving..." : "Submit & Share with All Students ✓"}
                    </button>
                    <p style={{ margin: "8px 0 0", fontSize: 11, color: "#8b949e", textAlign: "center" }}>
                      Your report will be visible to all NSBE students using this app.
                    </p>
                  </div>
                )}

                {/* Reports */}
                {entries.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8b949e", letterSpacing: 1, marginBottom: 10 }}>
                      ALL REPORTS (newest first)
                    </div>
                    {entries.map((entry, i) => (
                      <div key={entry.id || i} style={{
                        ...cardStyle, borderLeft: "3px solid #238636", marginBottom: 10,
                      }}>
                        <div style={{
                          fontSize: 11, color: "#8b949e", fontWeight: 600,
                          marginBottom: 10, display: "flex", justifyContent: "space-between",
                        }}>
                          <span>Report #{entries.length - i}</span>
                          <span>🕐 {formatTime(entry.created_at)}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: entry.notes ? 10 : 0 }}>
                          {FIELDS.map(f => entry[f.key] && (
                            <span key={f.key} style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: f.color + "20", color: f.color,
                              border: `1px solid ${f.color}50`,
                            }}>
                              {f.icon} {f.label}
                            </span>
                          ))}
                          {!FIELDS.some(f => entry[f.key]) && (
                            <span style={{ fontSize: 12, color: "#8b949e" }}>No options selected</span>
                          )}
                        </div>
                        {entry.notes && (
                          <div style={{
                            background: "#0d1117", borderRadius: 6, padding: "8px 10px",
                            fontSize: 12, color: "#c9d1d9", fontStyle: "italic",
                            borderLeft: "2px solid #30363d",
                          }}>
                            "{entry.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!selectedCompany && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#8b949e" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#e6edf3", marginBottom: 6 }}>
                  Search for a company above
                </div>
                <div style={{ fontSize: 13 }}>
                  See what other students reported or add your own findings.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
