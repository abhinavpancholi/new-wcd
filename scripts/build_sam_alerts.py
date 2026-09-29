"""
WCD ETL — SAM Anganwadi Alert Pre-Computation
==============================================
Reads  : public/data/compiled-district/{dist_code}.json  (33 files)
         public/data/districts.json                        (region lookup)
         public/data/NSWLD-compiled.json                   (district_name lookup)

Writes : public/data/compiled-anganwadi-alerts.json

Output shape
------------
{
  "meta": {
    "total":    <int>,   // anganwadis with data in both months (always all)
    "improved": <int>,   // delta >= 1
    "stagnant": <int>,   // delta == 0
    "worsened": <int>,   // delta < 0
    "dataIncomplete": 0  // always 0 — ETL already guarantees both months per record
  },
  "top50": [
    {
      "rank": 1,
      "anganwadi_name": "...",
      "block_name": "...",
      "dist_code": "438",
      "dist_name": "AHMADABAD",
      "region": "North Gujarat",
      "apr_female": 5,
      "apr_male": 8,
      "apr_total": 13,
      "oct_female": 0,
      "oct_male": 1,
      "oct_total": 1,
      "delta": 12,
      "female_delta": 5,
      "male_delta": 7,
      "status": "improved",
      "gender_gap": false
    }, ...
  ],
  "bottom50": [ ... same shape + gender_gap ... ],
  "districtCluster": [
    { "dist_name": "ANAND", "region": "Central Gujarat", "count": 12 }, ...
  ]
}

Delta formula (validated Power BI formula):
  delta        = apr_total  - oct_total
  female_delta = apr_female - oct_female
  male_delta   = apr_male   - oct_male

Status thresholds:
  delta >= 1   → 'improved'
  delta == 0   → 'stagnant'
  delta <  0   → 'worsened'

Gender gap flag:
  (female_delta < 0 and male_delta >= 0)
  OR (male_delta < 0 and female_delta >= 0)
"""

import json
import sys
from pathlib import Path
from collections import Counter

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR     = PROJECT_ROOT / "public" / "data"
DIST_DIR     = DATA_DIR / "compiled-district"
DISTRICTS_JSON   = DATA_DIR / "districts.json"
COMPILED_JSON    = DATA_DIR / "NSWLD-compiled.json"
OUT_PATH     = DATA_DIR / "compiled-anganwadi-alerts.json"

# ---------------------------------------------------------------------------
# Load lookup tables
# ---------------------------------------------------------------------------

def load_region_map():
    """Returns dict: district_code -> {district_name, region}"""
    with open(DISTRICTS_JSON, encoding="utf-8") as f:
        districts = json.load(f)
    return {
        d["district_code"]: {
            "district_name": d["district_name"],
            "region": d["region"]
        }
        for d in districts
    }

def load_compiled_district_names():
    """
    NSWLD-compiled.json maps district_code -> district_name (as it appears in the
    compiled sheet, e.g. 'AHMADABAD', 'AHMADABAD URBAN').
    We want the primary (non-URBAN) name for each district_code.
    Returns dict: district_code -> district_name (shortest / non-URBAN preferred)
    """
    with open(COMPILED_JSON, encoding="utf-8") as f:
        rows = json.load(f)
    
    code_names = {}
    for r in rows:
        code = r["district_code"]
        name = r.get("district_name", "")
        if code not in code_names:
            code_names[code] = name
        else:
            # Prefer the non-URBAN variant
            existing = code_names[code]
            if "URBAN" in existing and "URBAN" not in name:
                code_names[code] = name
    return code_names

# ---------------------------------------------------------------------------
# Main computation
# ---------------------------------------------------------------------------

def compute_status(delta):
    if delta >= 1:
        return "improved"
    if delta == 0:
        return "stagnant"
    return "worsened"

def compute_gender_gap(female_delta, male_delta):
    return (
        (female_delta < 0 and male_delta >= 0)
        or (male_delta < 0 and female_delta >= 0)
    )

def process():
    region_map = load_region_map()
    compiled_names = load_compiled_district_names()

    all_records = []
    missing_region = []

    dist_files = sorted(DIST_DIR.glob("*.json"))
    print(f"Found {len(dist_files)} district files.")

    for fpath in dist_files:
        dist_code = fpath.stem  # e.g. "438"

        lookup = region_map.get(dist_code)
        if not lookup:
            missing_region.append(dist_code)
            print(f"  ⚠️  No region found for dist_code={dist_code}, skipping file.")
            continue

        region    = lookup["region"]
        dist_name = compiled_names.get(dist_code, lookup["district_name"])

        with open(fpath, encoding="utf-8") as f:
            rows = json.load(f)

        for r in rows:
            apr_female = r.get("female_apr") or 0
            apr_male   = r.get("male_apr")   or 0
            oct_female = r.get("female_oct") or 0
            oct_male   = r.get("male_oct")   or 0

            apr_total  = apr_female + apr_male
            oct_total  = oct_female + oct_male

            delta        = apr_total  - oct_total
            female_delta = apr_female - oct_female
            male_delta   = apr_male   - oct_male

            all_records.append({
                "anganwadi_name": r.get("anganwadi_name", ""),
                "block_name":     r.get("block_name", ""),
                "dist_code":      dist_code,
                "dist_name":      dist_name,
                "region":         region,
                "apr_female":     apr_female,
                "apr_male":       apr_male,
                "apr_total":      apr_total,
                "oct_female":     oct_female,
                "oct_male":       oct_male,
                "oct_total":      oct_total,
                "delta":          delta,
                "female_delta":   female_delta,
                "male_delta":     male_delta,
                "status":         compute_status(delta),
                "gender_gap":     compute_gender_gap(female_delta, male_delta),
            })

    print(f"Total anganwadi records loaded: {len(all_records)}")
    if missing_region:
        print(f"⚠️  Districts with no region match: {missing_region}")

    # --- Summary stats ---
    total    = len(all_records)
    improved = sum(1 for r in all_records if r["status"] == "improved")
    stagnant = sum(1 for r in all_records if r["status"] == "stagnant")
    worsened = sum(1 for r in all_records if r["status"] == "worsened")

    print(f"\nSummary: total={total}  improved={improved}  stagnant={stagnant}  worsened={worsened}")

    # --- Top 50: sorted by delta DESC ---
    sorted_desc = sorted(all_records, key=lambda r: r["delta"], reverse=True)
    top50 = []
    for i, r in enumerate(sorted_desc[:50], start=1):
        top50.append({**r, "rank": i})

    # --- Bottom 50: sorted by delta ASC ---
    sorted_asc = sorted(all_records, key=lambda r: r["delta"])
    bottom50 = []
    for i, r in enumerate(sorted_asc[:50], start=1):
        bottom50.append({**r, "rank": i})

    # Debug: print top 3 and bottom 3 for spot-check
    print("\nTop 3 anganwadis by delta (most improved):")
    for r in top50[:3]:
        print(f"  #{r['rank']}  {r['anganwadi_name']} | {r['dist_name']} | d={r['delta']}")

    print("\nBottom 3 anganwadis by delta (worst):")
    for r in bottom50[:3]:
        print(f"  #{r['rank']}  {r['anganwadi_name']} | {r['dist_name']} | d={r['delta']}")

    # --- District cluster for bottom50 ---
    dist_counter = Counter(r["dist_name"] for r in bottom50)
    district_cluster = [
        {
            "dist_name": dist_name,
            "region":    next((r["region"] for r in bottom50 if r["dist_name"] == dist_name), ""),
            "count":     count
        }
        for dist_name, count in dist_counter.most_common()
    ]

    print(f"\nDistrict cluster (bottom 50): {district_cluster}")

    # --- Write output ---
    output = {
        "meta": {
            "total":          total,
            "improved":       improved,
            "stagnant":       stagnant,
            "worsened":       worsened,
            "dataIncomplete": 0
        },
        "top50":           top50,
        "bottom50":        bottom50,
        "districtCluster": district_cluster
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"\n✅  Written: {OUT_PATH}  ({size_kb:.1f} KB)")
    print(f"   top50 records: {len(top50)}")
    print(f"   bottom50 records: {len(bottom50)}")

if __name__ == "__main__":
    process()
