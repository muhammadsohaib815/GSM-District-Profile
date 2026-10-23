# GSM District Profile Dashboard (2017–2026)

The dashboard reads `data/District Data.csv` directly through a pandas-backed Python server for the KPI cards, summaries, and district filters. The TP Value chart reads `data/GSM TP VALUES (2017-2026).csv` for fiscal-year totals. Only fields present in these CSV files are shown; unsupported indicators and map locations display `-` or an unavailable message.

## Run locally

Install the Python dependency once with `python -m pip install -r requirements.txt`. Start the dashboard with `python server.py`, then open `http://127.0.0.1:5511/`. The Python server reads the CSV directly for each API request.

When the CSV changes, restart `python server.py`. `data_loader.py` uses pandas for CSV loading, type conversion, validation, filtering, grouping, and aggregation. District IDs are kept as strings so leading zeroes are preserved. The TP chart displays the CSV's units because the file does not specify a currency.

The “Avg Annual Gross Sales” card is calculated as the filtered TP value total divided by the number of years present in the filtered TP series. It updates for all data, a selected province, or a selected district/city. No beneficiaries column exists in `District Data.csv`, so the annual beneficiaries value remains unavailable rather than being derived from another field.

The right-side district list comes from `District Data.csv` (171 districts). The district profile is an aggregate profile without a Fiscal column, so district and province selections update the profile totals while the TP chart keeps the full 2017–2026 series. The district profile contains no latitude or longitude fields, so the map remains unavailable. Chart, map, icon, and font libraries load from public CDNs, so internet access is required for the full visual experience.

The partner strip is generated from the programme indicator columns in `District Data.csv`. Programme columns are grouped into KFW, LAD, DFID, GF, BMGF, USAID, Packard, PPIF, and Other. For each district, a partner flag is `1` when the sum of its programme columns is greater than zero; otherwise it is `0`. Programme columns without one of the named short partners are grouped under Other. Province and district filters update the visible partner names.
