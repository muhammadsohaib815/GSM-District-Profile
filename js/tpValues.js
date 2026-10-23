(function () {
  'use strict';

  const status = document.getElementById('tpStatus');
  const total = document.getElementById('tpTotal');
  const numberFormat = new Intl.NumberFormat('en-PK');
  const compactFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  let chart;
  let request;

  async function update(state) {
    if (request) request.abort();
    request = new AbortController();
    const query = new URLSearchParams();
    if (state.selectedProvinces.size === 1) query.set('province', [...state.selectedProvinces][0]);
    if (state.selectedDistricts.size === 1) query.set('district_id', [...state.selectedDistricts][0]);

    try {
      const response = await fetch(`/api/tp-values?${query}`, { signal: request.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      total.textContent = `Total ${numberFormat.format(data.total)}`;
      status.textContent = `${numberFormat.format(data.record_count)} CSV rows in view`;
      document.querySelectorAll('[data-summary="avgSales"]').forEach(element => {
        element.textContent = numberFormat.format(data.average_annual);
      });
      if (chart) {
        chart.data.labels = data.annual.map(item => item.year);
        chart.data.datasets[0].data = data.annual.map(item => item.value);
        chart.update();
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      total.textContent = 'Data unavailable';
      status.textContent = 'Start the dashboard with python server.py to read the CSV.';
    }
  }

  function init() {
    if (!window.Chart) {
      status.textContent = 'TP values loaded; chart requires an internet connection.';
      return;
    }
    chart = new Chart(document.getElementById('tpChart'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'TP value', data: [], backgroundColor: '#dc4655', borderRadius: 3 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { callback: value => compactFormat.format(value) } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: context => ` TP value: ${numberFormat.format(context.raw)}` } },
          datalabels: {
            anchor: 'end',
            align: 'top',
            clamp: true,
            color: '#64748b',
            font: { size: 10.5, weight: '700' },
            formatter: value => value ? compactFormat.format(value) : ''
          }
        }
      }
    });
  }

  window.GSM_TP = { init, update };
})();
