import React, { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, Bell } from 'lucide-react'
import { formatIndian } from '../../utils/formatters'
import SamAlertModal from './SamAlertModal'

/**
 * SAM Children Uplifted Donut Chart & Current Apr Baseline Stat Block
 * Fix 2: Always render a true Donut Chart (hollow ring with centered text) for positive values.
 * Renders red card box for net negative SAM increase (e.g. MORBI/MALIYA).
 */

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="wcd-tooltip">
      <div style={{ fontWeight: 700, color: item.color }}>{item.name}</div>
      <div style={{ fontSize: '0.75rem', marginTop: 2 }}>
        Uplifted Children: <strong>{formatIndian(item.value)}</strong>
      </div>
    </div>
  )
}

export default function SamUpliftedDonut({ samData }) {
  const [alertOpen, setAlertOpen] = useState(false)
  if (!samData) return null

  const femaleDelta = samData.female_delta || 0
  const maleDelta = samData.male_delta || 0
  const totalDelta = samData.total_delta || 0

  // April baseline totals for bottom stat block
  const femaleApr = samData.female_apr || 0
  const maleApr = samData.male_apr || 0
  const totalApr = femaleApr + maleApr

  const isNetNegative = totalDelta < 0

  const chartData = [
    { name: 'Female Uplifted', value: Math.max(0, femaleDelta), color: '#ec4899' },
    { name: 'Male Uplifted', value: Math.max(0, maleDelta), color: '#0284c7' },
  ]

  const hasPositiveData = chartData.some(d => d.value > 0) && totalDelta > 0

  const title = 'SAM Children Uplifted Apr 25 to Oct 25'

  const absFemaleDelta = Math.abs(femaleDelta)
  const absMaleDelta = Math.abs(maleDelta)
  const absTotalDelta = absFemaleDelta + absMaleDelta
  const femalePct = absTotalDelta > 0 ? ((absFemaleDelta / absTotalDelta) * 100).toFixed(2) : '0.00'
  const malePct = absTotalDelta > 0 ? ((absMaleDelta / absTotalDelta) * 100).toFixed(2) : '0.00'

  return (
    <>
    <div className="wcd-chart-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="wcd-chart-panel__title">
        <span>{title}</span>
        {/* Anganwadi Alerts ghost button — top-right of card header */}
        <button
          onClick={() => setAlertOpen(true)}
          title="Anganwadi Alerts"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          5,
            background:   'transparent',
            border:       '1px solid #940d0dff',
            borderRadius: 7,
            padding:      '3px 9px',
            color:        '#940d0dff',
            fontSize:     '0.65rem',
            fontWeight:   700,
            cursor:       'pointer',
            transition:   'all 0.15s ease',
            flexShrink:   0,
            lineHeight:   1,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ff0202ff'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#ff0000ff'
          }}
        >
          <AlertTriangle size={13} />
          Anganwadi Alerts
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 190 }}>
        {!hasPositiveData || isNetNegative ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 20px',
            borderRadius: 16,
            background: isNetNegative ? '#fff1f2' : '#f8fafc',
            border: isNetNegative ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
            textAlign: 'center',
            width: '85%',
          }}>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: isNetNegative ? '#dc2626' : '#64748b',
              lineHeight: 1
            }}>
              {formatIndian(totalDelta)}
            </div>
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: isNetNegative ? '#b91c1c' : '#64748b',
              marginTop: 6
            }}>
              {isNetNegative ? 'Net Increase in SAM Cases' : 'Total Uplifted'}
            </div>
            <div style={{ fontSize: '0.72rem', color: isNetNegative ? '#991b1b' : '#94a3b8', marginTop: 4, fontWeight: 500 }}>
              Female: {femaleDelta}, Male: {maleDelta}
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 25, left: 10 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Side percentage & count labels */}
            <div style={{
              position: 'absolute',
              top: '12%',
              right: '10%',
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              <div style={{ color: '#0284c7' }}>{formatIndian(maleDelta)}</div>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>({malePct}%)</div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: '22%',
              left: '10%',
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              <div style={{ color: '#ec4899' }}>{formatIndian(femaleDelta)}</div>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>({femalePct}%)</div>
            </div>

            {/* Center Donut Label */}
            <div style={{
              position: 'absolute',
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {formatIndian(totalDelta)}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                Total Uplifted
              </div>
            </div>

            {/* Bottom Legend */}
            <div style={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 16,
              fontSize: '0.68rem',
              fontWeight: 600,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899' }} />
                <span style={{ color: '#64748b' }}>Female Uplifted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
                <span style={{ color: '#64748b' }}>Male Uplifted</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* April Baseline Stat Block */}
      <div style={{
        marginTop: 8,
        padding: '10px 14px',
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Total SAM</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
            {formatIndian(totalApr)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#ec4899', fontWeight: 600 }}>Female SAM</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#be185d', marginTop: 2 }}>
            {formatIndian(femaleApr)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600 }}>Male SAM</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0369a1', marginTop: 2 }}>
            {formatIndian(maleApr)}
          </div>
        </div>
      </div>
    </div>
    <SamAlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  )
}
