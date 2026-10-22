(function () {
  'use strict';

  function render(districts, state) {
    const tpDistrictCount = window.GSM_TP.update(state);
    document.querySelectorAll('[data-kpi], [data-summary]').forEach(element => { element.textContent = '-'; });
    window.GSM_CHARTS.clear();
    window.GSM_MAP.update([]);
    document.getElementById('footerDistrictCount').textContent = `${tpDistrictCount} district${tpDistrictCount === 1 ? '' : 's'}`;
    const footerPartners = document.getElementById('footerPartners');
    footerPartners.textContent = 'No partner data in CSV';
    footerPartners.title = 'The CSV does not contain partner fields';
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
