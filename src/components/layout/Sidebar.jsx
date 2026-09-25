import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Target, ListChecks, BarChart3, MapPin, X } from 'lucide-react'
import useWcdStore from '../../context/WcdStore'

const NAV_ITEMS = [
  // { label: 'Summary', to: '/summary', disabled: true },
  { label: 'Overview', to: '/', disabled: false },
  { label: 'Health & Adolescent Nutrition', to: '/health', disabled: false },
  { label: 'Awareness & Behaviour Change', to: '/awareness', disabled: false },
  { label: 'Infra, Digital Platforms & Women Empowerment', to: '/infra', disabled: false },
]

const FY_OPTIONS = [
  '2022-23', '2023-24',
  '2024-25', '2025-26',
  '2026-27', '2027-28',
  '2028-29', '2029-30',
]

const REGIONS_LIST = [
  { name: 'Central Gujarat', color: '#a855f7' },
  { name: 'Coastal Saurashtra', color: '#38bdf8' },
  { name: 'Kutch', color: '#84cc16' },
  { name: 'North Gujarat', color: '#f43f5e' },
  { name: 'Saurashtra', color: '#eab308' },
  { name: 'South Gujarat', color: '#f97316' },
]

const REGION_DISTRICTS = {
  'Central Gujarat': ['ANAND', 'DAHOD', 'PANCHMAHAL', 'VADODARA', 'NARMADA', 'CHHOTA UDAIPUR', 'KHEDA', 'MAHISAGAR'],
  'Coastal Saurashtra': ['AMRELI', 'BHAVNAGAR', 'DEVBHUMI DWARKA', 'GIR SOMNATH', 'JUNAGADH', 'PORBANDAR'],
  'Kutch': ['KACHCHH'],
  'North Gujarat': ['AHMADABAD', 'ARVALLI', 'BANAS KANTHA', 'GANDHINAGAR', 'MAHESANA', 'PATAN', 'SABAR KANTHA'],
  'Saurashtra': ['BOTAD', 'JAMNAGAR', 'MORBI', 'RAJKOT', 'SURENDRANAGAR'],
  'South Gujarat': ['BHARUCH', 'DANG', 'NAVSARI', 'SURAT', 'TAPI', 'VALSAD'],
}

function StatCards() {
  const config = useWcdStore((s) => s.config)
  const location = useLocation()

  // Requirement: Stat cards (Interventions, Actionable Steps, KPIs) ONLY visible on Overview page (/ or /overview)
  if (location.pathname !== '/' && location.pathname !== '/overview') {
    return null
  }

  if (!config) return null

  return (
    <div className="wcd-stat-cards">
      <div className="wcd-stat-card wcd-stat-card--teal">
        <div className="wcd-stat-card__icon wcd-stat-card__icon--teal">
          <Target size={18} />
        </div>
        <div className="wcd-stat-card__content">
          <div className="wcd-stat-card__label">Interventions</div>
          <div className="wcd-stat-card__value">{config.interventions}</div>
        </div>
      </div>

      <div className="wcd-stat-card wcd-stat-card--blue">
        <div className="wcd-stat-card__icon wcd-stat-card__icon--blue">
          <ListChecks size={18} />
        </div>
        <div className="wcd-stat-card__content">
          <div className="wcd-stat-card__label">Actionable Steps</div>
          <div className="wcd-stat-card__value">{config.actionableSteps}</div>
        </div>
      </div>

      <div className="wcd-stat-card wcd-stat-card--purple">
        <div className="wcd-stat-card__icon wcd-stat-card__icon--purple">
          <BarChart3 size={18} />
        </div>
        <div className="wcd-stat-card__content">
          <div className="wcd-stat-card__label">KPIs</div>
          <div className="wcd-stat-card__value">{config.kpis}</div>
        </div>
      </div>
    </div>
  )
}

function FyGrid() {
  const { selectedFY, setFY } = useWcdStore()

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 6,
      padding: '12px 14px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 8,
      marginBottom: 12,
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {FY_OPTIONS.map((fy) => {
        const isSelected = selectedFY === fy
        return (
          <button
            key={fy}
            onClick={() => setFY(fy)}
            style={{
              padding: '6px 4px',
              fontSize: '0.72rem',
              fontWeight: isSelected ? 700 : 500,
              color: isSelected ? '#ffffff' : '#cbd5e1',
              backgroundColor: isSelected ? '#0284c7' : 'rgba(30, 41, 59, 0.6)',
              border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            {fy}
          </button>
        )
      })}
    </div>
  )
}

function RegionThumbnails() {
  const { selectedRegion, setRegion } = useWcdStore()
  const location = useLocation()

  // Requirement: On Overview page (/), do NOT show region buttons on the sidebar
  if (location.pathname === '/' || location.pathname === '/overview') {
    return null
  }

  if (selectedRegion) {
    const distList = REGION_DISTRICTS[selectedRegion] || []
    const regionObj = REGIONS_LIST.find(r => r.name === selectedRegion) || { color: '#38bdf8' }

    return (
      <div style={{ padding: '0 14px 14px 14px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={12} color={regionObj.color} />
            <span>Region Selected</span>
          </div>
          <button
            onClick={() => setRegion(null)}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.65rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            Reset <X size={10} />
          </button>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: `1.5px solid ${regionObj.color}`,
          borderRadius: 8,
          padding: '10px 12px',
          boxShadow: `0 4px 14px rgba(0, 0, 0, 0.35)`,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: regionObj.color, boxShadow: `0 0 8px ${regionObj.color}` }} />
            <span>{selectedRegion}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {distList.map(d => (
              <span key={d} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 600
              }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 14px 14px 14px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '0.72rem',
        fontWeight: 700,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 8
      }}>
        <MapPin size={12} color="#38bdf8" />
        <span>Filter By Region</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {REGIONS_LIST.map((reg) => (
          <button
            key={reg.name}
            onClick={() => setRegion(reg.name)}
            style={{
              background: 'rgba(30, 41, 59, 0.65)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              borderLeft: `3.5px solid ${reg.color}`,
              borderRadius: 6,
              padding: '8px 6px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(51, 65, 85, 0.85)'
              e.currentTarget.style.borderColor = reg.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.65)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderLeft = `3.5px solid ${reg.color}`
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.2 }}>
              {reg.name}
            </div>
            <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: 2 }}>
              {REGION_DISTRICTS[reg.name]?.length || 0} Districts
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ActiveFilters() {
  const { selectedFY, selectedRegion, selectedDistrict, setFY, setRegion, setDistrict, resetFilters } = useWcdStore()

  if (!selectedFY && !selectedRegion && !selectedDistrict) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 14px', marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>
        Active Filters
      </div>
      <div style={{ display: 'flex', gap: '4px', color: '#ffffff', flexWrap: 'wrap' }}>
        {selectedFY && (
          <div className="wcd-chip wcd-chip--active" onClick={() => setFY(selectedFY)} style={{ cursor: 'pointer', fontSize: '10px', padding: '2px 6px' }}>
            {selectedFY} ✕
          </div>
        )}
        {selectedRegion && (
          <div className="wcd-chip wcd-chip--active" onClick={() => setRegion(selectedRegion)} style={{ cursor: 'pointer', fontSize: '10px', padding: '2px 6px' }}>
            {selectedRegion} ✕
          </div>
        )}
        {selectedDistrict && (
          <div className="wcd-chip wcd-chip--active" onClick={() => setDistrict(selectedDistrict)} style={{ cursor: 'pointer', fontSize: '10px', padding: '2px 6px' }}>
            {selectedDistrict} ✕
          </div>
        )}
        <div
          className="wcd-chip"
          style={{ backgroundColor: '#1e293b', color: '#cbd5e1', cursor: 'pointer', fontSize: '10px', padding: '2px 6px', border: '1px solid #334155' }}
          onClick={resetFilters}
        >
          Clear all
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ topSlot = 'stat-cards' }) {
  return (
    <aside className="wcd-sidebar">
      {/* Top Slot — Stat Cards or FY Grid */}
      <div className="wcd-sidebar__top">
        <FyGrid />
        {topSlot === 'stat-cards' && <StatCards />}
      </div>

      {/* Middle Slot — Nav List */}
      <nav className="wcd-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          item.disabled ? (
            <div
              key={item.to}
              className="wcd-nav-item wcd-nav-item--disabled"
              title="Coming soon"
            >
              <span>{item.label}</span>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `wcd-nav-item ${isActive ? 'wcd-nav-item--active' : ''}`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          )
        ))}
        <ActiveFilters />
      </nav>

      {/* Bottom Slot — Region Thumbnail Widget */}
      <div className="wcd-sidebar__bottom" style={{ marginTop: 'auto' }}>
        <RegionThumbnails />
        <div className="wcd-sidebar-footer__text">
            The data and references shown are dummy and representative in nature, intended solely for demonstration purposes.
        </div>
      </div>

    </aside>
  )
}
