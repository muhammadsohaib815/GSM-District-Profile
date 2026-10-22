# GSM District Profile Dashboard (2017–2026)

The TP Value chart reads `data/GSM TP VALUES (2017-2026).csv` directly through a pandas-backed Python server. The existing province and district filters on the right control this chart. Only fields present in the CSV are shown; unsupported indicators and map locations display `-` or an unavailable message.

## Run locally

Install the Python dependency once with `python -m pip install -r requirements.txt`. Start the dashboard with `python server.py`, then open `http://127.0.0.1:5511/`. The Python server reads the CSV directly for each API request.

When the CSV changes, restart `python server.py`. `data_loader.py` uses pandas for CSV loading, type conversion, validation, filtering, grouping, and aggregation. District IDs are kept as strings so leading zeroes are preserved. The TP chart displays the CSV's units because the file does not specify a currency.

The “Avg Annual Gross Sales” card is calculated as the filtered TP value total divided by the 10 fiscal years (2017–2026). It updates for all data, a selected province, or a selected district/city.

The right-side district list comes from the CSV (127 districts). The CSV contains no population, provider, service, partner, latitude, or longitude fields, so those sections remain unavailable. Chart, map, icon, and font libraries load from public CDNs, so internet access is required for the full visual experience.
