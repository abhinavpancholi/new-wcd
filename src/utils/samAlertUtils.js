/**
 * WCD Dashboard — SAM Alert Utilities
 * ====================================
 * Processes pre-computed compiled-anganwadi-alerts.json data.
 * The JSON already contains pre-sorted top50 / bottom50 / districtCluster
 * and summary meta — this utility exposes them through a clean API.
 *
 * Delta formula (validated Power BI formula):
 *   delta        = apr_total  − oct_total
 *   female_delta = apr_female − oct_female
 *   male_delta   = apr_male   − oct_male
 *
 * Status thresholds (hardcoded, confirmed):
 *   delta >= 1  → 'improved'
 *   delta === 0 → 'stagnant'
 *   delta <  0  → 'worsened'
 *
 * Gender gap flag:
 *   (female_delta < 0 && male_delta >= 0)
 *   || (male_delta < 0 && female_delta >= 0)
 */

/**
 * Returns the pre-computed alert data as-is from the alerts JSON.
 * Since the ETL has already ranked and sorted everything, no further
 * computation is needed at runtime.
 *
 * @param {Object} alertsJson - Parsed compiled-anganwadi-alerts.json
 * @returns {{
 *   summary: { total, improved, stagnant, worsened, dataIncomplete },
 *   top50: Array,
 *   bottom50: Array,
 *   districtCluster: Array
 * }}
 */
export function computeSAMAlerts(alertsJson) {
  if (!alertsJson) {
    return {
      summary: { total: 0, improved: 0, stagnant: 0, worsened: 0, dataIncomplete: 0 },
      top50: [],
      bottom50: [],
      districtCluster: [],
    }
  }

  return {
    summary: {
      total:          alertsJson.meta?.total          ?? 0,
      improved:       alertsJson.meta?.improved       ?? 0,
      stagnant:       alertsJson.meta?.stagnant       ?? 0,
      worsened:       alertsJson.meta?.worsened       ?? 0,
      dataIncomplete: alertsJson.meta?.dataIncomplete ?? 0,
    },
    top50:           alertsJson.top50          ?? [],
    bottom50:        alertsJson.bottom50       ?? [],
    districtCluster: alertsJson.districtCluster ?? [],
  }
}

/**
 * Exports the given rows as a flat CSV and triggers a browser download.
 *
 * @param {Array}  rows      - top50 or bottom50 records
 * @param {string} filename  - 'wcd-sam-top50.csv' or 'wcd-sam-bottom50.csv'
 */
export function exportSAMAlertCSV(rows, filename) {
  const headers = [
    'rank', 'anganwadi_name', 'block', 'district', 'region',
    'apr_sam', 'oct_sam', 'delta', 'female_delta', 'male_delta', 'status'
  ]

  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const csvRows = [
    headers.join(','),
    ...rows.map(r => [
      r.rank,
      escape(r.anganwadi_name),
      escape(r.block_name),
      escape(r.dist_name),
      escape(r.region),
      r.apr_total,
      r.oct_total,
      r.delta,
      r.female_delta,
      r.male_delta,
      r.status,
    ].join(','))
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
