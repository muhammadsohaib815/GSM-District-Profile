# GSM District Profile Dashboard (2017–2026)

Frontend-only interactive dashboard built with HTML, CSS, vanilla JavaScript, Chart.js, Leaflet, marker clustering, and Lucide icons.

## Run locally

1. Open the `gsm-district-dashboard` folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html` and choose **Open with Live Server**.

Alternatively, from this folder run `python -m http.server 5511` (if Python is installed) and open `http://localhost:5511`.

Chart, map, icon, and font libraries load from public CDNs, so internet access is required for the full experience. All dashboard records are deterministic demonstration data in `js/mockData.js`; no real patient, provider, or sales data is included.
