(function () {
  'use strict';

  const charts = {};
  const fpColors = ['#188fec', '#162f88', '#ef6d2f', '#df455a', '#a33ba1', '#6f59ad'];
  const beneficiaryColors = ['#188fec', '#153985', '#ef6d2f', '#6c48a8', '#e54e76', '#11a0a1'];
  const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const percentLabel = (value, total) => {
    const percent = total ? Number(value) / total * 100 : 0;
    if (!percent) return '0%';
    return percent < 1 ? `${percent.toFixed(2)}%` : `${Math.round(percent)}%`;
  };

  function createLegend(containerId, labels, values, colors) {
    const safeValues = values.map(numeric);
    const total = safeValues.reduce((sum, value) => sum + value, 0) || 1;
    document.getElementById(containerId).innerHTML = labels.map((label, index) =>
      `<span class="legend-item"><i style="background:${colors[index]}"></i>${label} <strong>${percentLabel(safeValues[index], total)}</strong></span>`
    ).join('');
  }

  function doughnutOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      // Reserve space around the ring so percentage labels never touch the
      // panel header or get clipped by the card's overflow boundary.
      layout: { padding: { top: 15, right: 12, bottom: 6, left: 12 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((sum, value) => sum + value, 0) || 1;
              return ` ${context.label}: ${context.raw.toLocaleString()} (${percentLabel(context.raw, total)})`;
            }
          }
        },
        datalabels: {
          color: '#334155',
          anchor: 'end',
          align: 'end',
          offset: 2,
          clamp: true,
          font: { family: 'Inter', size: 11.5, weight: '700' },
          formatter(value, context) {
            const total = context.dataset.data.reduce((sum, item) => sum + item, 0) || 1;
            const pct = value / total * 100;
            return pct >= 6 ? `${Math.round(pct)}%` : '';
          }
        }
      }
    };
  }

  function init() {
    if (!window.Chart) {
      document.querySelectorAll('.chart-wrap').forEach(el => { el.innerHTML = '<p class="empty-filter">Charts require an internet connection to load Chart.js.</p>'; });
      return;
    }
    if (window.ChartDataLabels) Chart.register(window.ChartDataLabels);
    Chart.defaults.font.family = 'Inter, Arial, sans-serif';
    Chart.defaults.color = '#64748b';

    charts.fp = new Chart(document.getElementById('fpUsersChart'), {
      type: 'doughnut', data: { labels: [], datasets: [{ data: [], backgroundColor: fpColors, borderColor: '#fff', borderWidth: 2, hoverOffset: 4 }] }, options: doughnutOptions()
    });
    charts.beneficiaries = new Chart(document.getElementById('beneficiariesChart'), {
      type: 'doughnut', data: { labels: [], datasets: [{ data: [], backgroundColor: beneficiaryColors, borderColor: '#fff', borderWidth: 2, hoverOffset: 4 }] }, options: doughnutOptions()
    });
  }

  function update(metrics) {
    if (!charts.fp) return;

    const fpLabels = ['Condoms', 'Pills', 'IUD', 'Injectables', 'Implant', 'VSC'];
    const fpValues = [metrics.fpUsers.condom, metrics.fpUsers.pills, metrics.fpUsers.iud, metrics.fpUsers.injectables, metrics.fpUsers.implant, metrics.fpUsers.vsc].map(numeric);
    charts.fp.data.labels = fpLabels;
    charts.fp.data.datasets[0].data = fpValues;
    charts.fp.update();
    createLegend('fpLegend', fpLabels, fpValues, fpColors);

    const benLabels = ['FP Clients', 'NFP Users', 'Deliveries', 'IPC', 'TB', 'Other'];
    const benValues = [metrics.beneficiaries.fpClients, metrics.beneficiaries.nfpUsers, metrics.beneficiaries.deliveries, metrics.beneficiaries.ipc, metrics.beneficiaries.tb, metrics.beneficiaries.other].map(numeric);
    charts.beneficiaries.data.labels = benLabels;
    charts.beneficiaries.data.datasets[0].data = benValues;
    charts.beneficiaries.update();
    createLegend('beneficiaryLegend', benLabels, benValues, beneficiaryColors);
  }

  function clear() {
    if (!charts.fp) return;
    charts.fp.data.labels = [];
    charts.fp.data.datasets[0].data = [];
    charts.fp.update();
    charts.beneficiaries.data.labels = [];
    charts.beneficiaries.data.datasets[0].data = [];
    charts.beneficiaries.update();
    document.getElementById('fpLegend').textContent = 'No CSV data available';
    document.getElementById('beneficiaryLegend').textContent = 'No CSV data available';
  }

  window.GSM_CHARTS = { init, update, clear };
})();
