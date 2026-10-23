(function () {
  'use strict';

  function render(districts, state) {
    document.querySelectorAll('[data-kpi], [data-summary]').forEach(element => { element.textContent = '-'; });
    window.GSM_CHARTS.clear();
    window.GSM_MAP.update([]);
    document.getElementById('footerDistrictCount').textContent = 'Loading districts';
    window.GSM_TP.update(state);
    window.GSM_DASHBOARD.update(state);
    const footerPartners = document.getElementById('footerPartners');
    footerPartners.textContent = 'District profile data loaded';
    footerPartners.title = 'District Data.csv is the source for the dashboard metrics';
  }

  function init() {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    window.GSM_CHARTS.init();
    window.GSM_TP.init();
    window.GSM_MAP.init();
    window.GSM_FILTERS.init(render);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
