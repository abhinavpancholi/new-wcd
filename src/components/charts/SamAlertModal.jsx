import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Bell, X, Download } from 'lucide-react'
import { formatIndian } from '../../utils/formatters'
import { computeSAMAlerts, exportSAMAlertCSV } from '../../utils/samAlertUtils'

/**
 * SAM Anganwadi Alert Modal — Light Elegant Theme
 * =================================================
 * Matches the WCD dashboard's premium light palette:
 * white cards, soft borders, teal/blue accents, Outfit headings.
 *
 * Data: loaded lazily from /data/compiled-anganwadi-alerts.json on first open.
 * FY / Region / District filters do NOT apply here.
 */

// ─── Light-theme tokens (matching index.css design system) ────────────────────
const C = {
  // Backgrounds
  bgModal:       '#ffffff',
  bgHeader:      'linear-gradient(135deg, #0d9488, #2563eb)',   // same as wcd-banner gradient
  bgHeaderSolid: '#f8fafc',
  bgChipRow:     '#f3f5f9',                                     // --wcd-bg-page
  bgGroupHeader: '#f1f5f9',
  bgTableHead:   '#f8fafc',
  rowEven:       '#fafbfd',

  // Borders
  border:        '#e2e8f0',   // --wcd-border
  borderSubtle:  '#f1f5f9',

  // Accents
  teal600:       '#0f766e',   // --wcd-teal-600
  teal500:       '#0d9488',   // --wcd-teal-500
  teal400:       '#14b8a6',
  tealBg:        '#ccfbf1',   // --wcd-teal-100
  blue600:       '#1d4ed8',
  blue500:       '#2563eb',
  green600:      '#059669',
  greenBg:       '#d1fae5',   // --wcd-green-100
  amber600:      '#d97706',
  amberBg:       '#fef3c7',   // --wcd-orange-100
  red600:        '#dc2626',
  redBg:         '#fee2e2',
  coral400:      '#f87171',

  // Text
  textPrimary:   '#0f172a',   // --wcd-text-primary
  textSecondary: '#475569',   // --wcd-text-secondary
  textMuted:     '#64748b',   // --wcd-text-muted

  // Female / Male accent
  female:        '#be185d',
  femaleSoft:    '#ec4899',
  male:          '#0369a1',
  maleSoft:      '#0284c7',

  // Shadow
  shadow:        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    worsened: { bg: C.redBg,    color: C.red600,  label: '🔴 Worsened' },
    stagnant: { bg: C.amberBg,  color: C.amber600, label: '🟡 Stagnant' },
    improved: { bg: C.greenBg,  color: C.green600, label: '✅ Improved' },
  }[status] || { bg: '#f1f5f9', color: C.textMuted, label: status }

  return (
    <span style={{
      background:   cfg.bg,
      color:        cfg.color,
      padding:      '2px 8px',
      borderRadius: 10,
      fontSize:     '0.66rem',
      fontWeight:   700,
      whiteSpace:   'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ─── Gender gap tag ───────────────────────────────────────────────────────────
function GenderGapTag() {
  return (
    <span style={{
      background:   C.amberBg,
      color:        C.amber600,
      padding:      '1px 6px',
      borderRadius: 8,
      fontSize:     '0.6rem',
      fontWeight:   600,
      marginLeft:   5,
    }}>
      ⚠ gender gap
    </span>
  )
}

// ─── Summary stat chips ───────────────────────────────────────────────────────
function SummaryChips({ summary }) {
  const chips = [
    { label: 'Total Tracked', value: summary.total,    icon: '📍', borderColor: C.border,   valueColor: C.textPrimary, bg: '#ffffff' },
    { label: 'Improved',      value: summary.improved, icon: '✅', borderColor: '#86efac',   valueColor: C.green600,    bg: '#f0fdf4' },
    { label: 'Stagnant',      value: summary.stagnant, icon: '⚠️', borderColor: '#fde68a',   valueColor: C.amber600,    bg: '#fffbeb' },
    { label: 'Worsened',      value: summary.worsened, icon: '🔴', borderColor: '#fca5a5',   valueColor: C.red600,      bg: '#fef2f2' },
  ]

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 20px', background: C.bgChipRow }}>
      {chips.map(({ label, value, icon, borderColor, valueColor, bg }) => (
        <div key={label} style={{
          background:   bg,
          border:       `1px solid ${borderColor}`,
          borderRadius: 10,
          padding:      '8px 18px',
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          minWidth:     110,
          boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: '0.63rem', color: C.textMuted, fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {icon} {label}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: valueColor, fontFamily: 'Outfit, Inter, sans-serif' }}>
            {formatIndian(value)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Shared table header ──────────────────────────────────────────────────────
function TableHead({ cols }) {
  return (
    <thead>
      <tr>
        {cols.map(({ label, align, width }) => (
          <th key={label} style={{
            padding:        '7px 8px',
            fontSize:       '0.62rem',
            fontWeight:     700,
            color:          C.textMuted,
            textTransform:  'uppercase',
            letterSpacing:  '0.05em',
            textAlign:      align || 'left',
            whiteSpace:     'nowrap',
            borderBottom:   `2px solid ${C.border}`,
            background:     C.bgTableHead,
            position:       'sticky',
            top:            0,
            zIndex:         2,
            width:          width || 'auto',
          }}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

// ─── Tab 1: Top 50 flat table ─────────────────────────────────────────────────
function Top50Table({ rows }) {
  const cols = [
    { label: '#',           width: 32 },
    { label: 'Anganwadi'               },
    { label: 'Block'                   },
    { label: 'District'                },
    { label: 'Region'                  },
    { label: 'Apr SAM',  align: 'right', width: 72 },
    { label: 'Oct SAM',  align: 'right', width: 72 },
    { label: 'Δ Delta',  align: 'right', width: 76 },
    { label: 'Δ Female',      align: 'right', width: 60 },
    { label: 'Δ Male',      align: 'right', width: 60 },
  ]

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <TableHead cols={cols} />
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.rank}
              style={{
                background: idx % 2 === 1 ? C.rowEven : '#ffffff',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0fdfa'}
              onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? C.rowEven : '#ffffff'}
            >
              <td style={{ padding: '6px 8px', color: C.textMuted, textAlign: 'center', fontWeight: 600, fontSize: '0.7rem' }}>{r.rank}</td>
              <td style={{ padding: '6px 8px', color: C.textPrimary, fontWeight: 600 }}>{r.anganwadi_name}</td>
              <td style={{ padding: '6px 8px', color: C.textSecondary }}>{r.block_name}</td>
              <td style={{ padding: '6px 8px', color: C.textSecondary }}>{r.dist_name}</td>
              <td style={{ padding: '6px 8px', color: C.textMuted, fontSize: '0.7rem' }}>{r.region}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: C.textPrimary, fontWeight: 500 }}>{formatIndian(r.apr_total)}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: C.textSecondary }}>{formatIndian(r.oct_total)}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: C.teal600 }}>
                +{formatIndian(r.delta)}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: C.femaleSoft, fontSize: '0.7rem', fontWeight: 600 }}>
                +{r.female_delta}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: C.maleSoft, fontSize: '0.7rem', fontWeight: 600 }}>
                +{r.male_delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── District cluster bar chart (pure CSS flex — light theme) ──────────────────
function DistrictClusterBar({ data }) {
  if (!data || data.length === 0) return null
  const maxCount = data[0]?.count || 1

  return (
    <div style={{
      padding:      '12px 18px 8px',
      borderBottom: `1px solid ${C.border}`,
      flexShrink:   0,
      background:   '#fffbeb',
    }}>
      <div style={{ fontSize: '0.65rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        🏥 District Focus — Bottom 50 Concentration
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.map(({ dist_name, region, count }) => {
          const pct = (count / maxCount) * 100
          const isHigh = count >= 5
          return (
            <div key={dist_name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 110, fontSize: '0.66rem', color: C.textSecondary, fontWeight: 600, flexShrink: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={`${dist_name} · ${region}`}>
                {dist_name}
              </div>
              <div style={{ flex: 1, height: 14, background: '#fef3c7', borderRadius: 7, overflow: 'hidden', border: '1px solid #fde68a' }}>
                <div style={{
                  width:        `${pct}%`,
                  height:       '100%',
                  background:   isHigh
                    ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                    : 'linear-gradient(90deg, #d97706, #f59e0b)',
                  borderRadius: 7,
                  transition:   'width 0.5s ease',
                }} />
              </div>
              <div style={{
                width: 24, textAlign: 'right', fontSize: '0.68rem', fontWeight: 800,
                color: isHigh ? C.red600 : C.amber600, flexShrink: 0,
              }}>
                {count}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab 2: Bottom 50 grouped collapsible table ───────────────────────────────
function Bottom50Table({ rows, districtCluster }) {
  const districtOrder = districtCluster.map(d => d.dist_name)
  const groups = useMemo(() => {
    const byDist = {}
    rows.forEach(r => {
      if (!byDist[r.dist_name]) byDist[r.dist_name] = []
      byDist[r.dist_name].push(r)
    })
    Object.values(byDist).forEach(g => g.sort((a, b) => a.delta - b.delta))
    return districtOrder
      .filter(d => byDist[d])
      .map(d => ({ distName: d, region: byDist[d][0]?.region || '', rows: byDist[d] }))
  }, [rows, districtCluster, districtOrder])

  const [collapsed, setCollapsed] = useState({})
  const toggleGroup = useCallback((distName) => {
    setCollapsed(prev => ({ ...prev, [distName]: !prev[distName] }))
  }, [])

  const cols = [
    { label: '#',          width: 32 },
    { label: 'Anganwadi'              },
    { label: 'Block'                  },
    { label: 'Apr SAM',  align: 'right', width: 72 },
    { label: 'Oct SAM',  align: 'right', width: 72 },
    { label: 'Δ Delta',  align: 'right', width: 76 },
    { label: 'Δ Female',      align: 'right', width: 60 },
    { label: 'Δ Male',      align: 'right', width: 60 },
    { label: 'Status',   width: 108 },
  ]

  const deltaColor = (d) => d < 0 ? C.red600 : d === 0 ? C.amber600 : C.teal600

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <TableHead cols={cols} />
        <tbody>
          {groups.map(({ distName, region, rows: groupRows }) => {
            const isCollapsed = !!collapsed[distName]
            return (
              <React.Fragment key={distName}>
                {/* Group header row */}
                <tr
                  onClick={() => toggleGroup(distName)}
                  style={{
                    background: 'linear-gradient(90deg, #f1f5f9, #f8fafc)',
                    cursor:     'pointer',
                    userSelect: 'none',
                    borderTop:  `1px solid ${C.border}`,
                  }}
                >
                  <td colSpan={9} style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.72rem', color: C.textMuted, width: 12 }}>
                        {isCollapsed ? '▸' : '▾'}
                      </span>
                      <span style={{ fontWeight: 800, color: C.textPrimary, fontSize: '0.78rem', fontFamily: 'Outfit, Inter, sans-serif' }}>
                        {distName}
                      </span>
                      <span style={{
                        color: C.textMuted, fontSize: '0.68rem', fontWeight: 500,
                        background: '#f1f5f9', padding: '1px 8px', borderRadius: 6,
                      }}>
                        {region}
                      </span>
                      <span style={{
                        marginLeft:   'auto',
                        background:   C.redBg,
                        color:        C.red600,
                        padding:      '2px 10px',
                        borderRadius: 8,
                        fontSize:     '0.65rem',
                        fontWeight:   700,
                        border:       '1px solid #fca5a5',
                      }}>
                        {groupRows.length} anganwadi{groupRows.length > 1 ? 's' : ''}
                      </span>
                      <span style={{ color: C.textMuted, fontSize: '0.6rem', fontWeight: 500 }}>
                        {isCollapsed ? 'expand →' : 'collapse →'}
                      </span>
                    </div>
                  </td>
                </tr>
                {/* Detail rows */}
                {!isCollapsed && groupRows.map((r, idx) => (
                  <tr
                    key={r.rank}
                    style={{
                      background: idx % 2 === 1 ? C.rowEven : '#ffffff',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? C.rowEven : '#ffffff'}
                  >
                    <td style={{ padding: '6px 8px', color: C.textMuted, textAlign: 'center', fontWeight: 600, fontSize: '0.7rem' }}>{r.rank}</td>
                    <td style={{ padding: '6px 8px', color: C.textPrimary, fontWeight: 600 }}>
                      {r.anganwadi_name}
                      {r.gender_gap && <GenderGapTag />}
                    </td>
                    <td style={{ padding: '6px 8px', color: C.textSecondary }}>{r.block_name}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: C.textPrimary, fontWeight: 500 }}>{formatIndian(r.apr_total)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: C.textSecondary }}>{formatIndian(r.oct_total)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: deltaColor(r.delta) }}>
                      {r.delta > 0 ? `+${r.delta}` : r.delta}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 600, color: deltaColor(r.female_delta) }}>
                      {r.female_delta > 0 ? `+${r.female_delta}` : r.female_delta}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.7rem', fontWeight: 600, color: deltaColor(r.male_delta) }}>
                      {r.male_delta > 0 ? `+${r.male_delta}` : r.male_delta}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function SamAlertModal({ open, onClose }) {
  const [alertData,  setAlertData]  = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState(0) // 0 = Top50, 1 = Bottom50

  // Lazy-load alerts JSON on first open
  useEffect(() => {
    if (!open || alertData || loading) return
    setLoading(true)
    fetch('/data/compiled-anganwadi-alerts.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load alert data')
        return r.json()
      })
      .then(json => {
        setAlertData(json)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [open, alertData, loading])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const computed = useMemo(() => computeSAMAlerts(alertData), [alertData])

  const handleExport = useCallback(() => {
    if (activeTab === 0) {
      exportSAMAlertCSV(computed.top50,    'wcd-sam-top50.csv')
    } else {
      exportSAMAlertCSV(computed.bottom50, 'wcd-sam-bottom50.csv')
    }
  }, [activeTab, computed])

  if (!open) return null

  const tabs = [
    { label: '🟢 Top 50 Performing',  id: 0 },
    { label: '🔴 Bottom 50 Lagging',  id: 1 },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          right:           0,
          bottom:          0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter:  'blur(8px)',
          zIndex:          99998,
        }}
      />

      {/* Modal box */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:      'fixed',
          top:           '50%',
          left:          '50%',
          transform:     'translate(-50%, -50%)',
          zIndex:        99999,
          width:         'min(90vw, 1100px)',
          height:        '85vh',
          background:    C.bgModal,
          borderRadius:  16,
          boxShadow:     C.shadow,
          border:        `1px solid ${C.border}`,
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          fontFamily:    'Inter, system-ui, sans-serif',
          color:         C.textPrimary,
        }}
      >
        {/* ── Gradient banner header ───────────────────────────── */}
        <div style={{
          background:   C.bgHeader,
          padding:      '14px 20px 12px',
          flexShrink:   0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={18} color='#ffffff' />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'Outfit, Inter, sans-serif' }}>
                Anganwadi SAM Alert Report
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                Apr 2025 → Oct 2025 &nbsp;·&nbsp; {formatIndian(computed.summary.total)} anganwadis tracked &nbsp;·&nbsp; FY filter does not apply to this snapshot
              </div>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExport}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          5,
                background:   'rgba(255,255,255,0.15)',
                border:       '1px solid rgba(255,255,255,0.35)',
                borderRadius: 8,
                padding:      '5px 12px',
                color:        '#ffffff',
                fontSize:     '0.72rem',
                fontWeight:   700,
                cursor:       'pointer',
                transition:   'all 0.15s ease',
                backdropFilter: 'blur(4px)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              title='Export current tab as CSV'
            >
              <Download size={13} />
              Export CSV
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                background:   'rgba(255,255,255,0.15)',
                border:       '1px solid rgba(255,255,255,0.25)',
                borderRadius: 8,
                width:        32,
                height:       32,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                cursor:       'pointer',
                color:        '#ffffff',
                transition:   'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Summary chips ────────────────────────────────────── */}
        {alertData && <SummaryChips summary={computed.summary} />}

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div style={{
          display:      'flex',
          gap:          0,
          borderBottom: `2px solid ${C.border}`,
          paddingLeft:  20,
          flexShrink:   0,
          background:   '#ffffff',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background:     'transparent',
                border:         'none',
                borderBottom:   activeTab === tab.id
                  ? `3px solid ${C.teal500}`
                  : '3px solid transparent',
                color:          activeTab === tab.id ? C.textPrimary : C.textMuted,
                fontWeight:     activeTab === tab.id ? 700 : 500,
                fontSize:       '0.78rem',
                padding:        '10px 20px',
                cursor:         'pointer',
                transition:     'all 0.15s ease',
                whiteSpace:     'nowrap',
                fontFamily:     'Inter, system-ui, sans-serif',
                marginBottom:   '-2px',
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = C.textSecondary }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = C.textMuted }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Body (scrollable) ────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: C.textMuted, fontSize: '0.85rem', gap: 8 }}>
              <div style={{
                width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.teal500,
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              Loading alert data…
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: C.red600, fontSize: '0.85rem', gap: 6 }}>
              ⚠️ {error}
            </div>
          )}
          {alertData && activeTab === 0 && (
            <Top50Table rows={computed.top50} />
          )}
          {alertData && activeTab === 1 && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <DistrictClusterBar data={computed.districtCluster} />
              <Bottom50Table rows={computed.bottom50} districtCluster={computed.districtCluster} />
            </div>
          )}
        </div>

        {/* ── Footer note ──────────────────────────────────────── */}
        <div style={{
          padding:      '6px 20px',
          borderTop:    `1px solid ${C.border}`,
          background:   C.bgChipRow,
          fontSize:     '0.62rem',
          color:        C.textMuted,
          textAlign:    'center',
          fontWeight:   500,
          flexShrink:   0,
        }}>
          Data snapshot: Apr 2025 → Oct 2025 &nbsp;·&nbsp; SAM Uplifted = April Total − October Total &nbsp;·&nbsp; Source: WCD Compiled Sheet
        </div>
      </div>
    </>
  )
}
