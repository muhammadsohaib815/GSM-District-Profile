(function () {
  'use strict';

  const numberFormat = new Intl.NumberFormat('en-PK');
  const sum = (items, getter) => items.reduce((total, item) => total + getter(item), 0);
  const sumObject = (items, key, fields) => Object.fromEntries(fields.map(field => [field, sum(items, item => item[key][field])]));

  function aggregate(districts) {
    const fpFields = ['condom', 'pills', 'iud', 'injectables', 'implant', 'vsc'];
    const beneficiaryFields = ['fpClients', 'nfpUsers', 'deliveries', 'ipc', 'tb', 'other'];
    const cypFields = ['total', 'condom', 'pills', 'iud', 'injectables'];
    const networkFields = ['total', 'providers', 'chemists', 'outlets', 'otherCadres'];
    const serviceFields = ['fpClients', 'iudInsertions', 'mva', 'pacfp', 'deliveries'];
    const healthImpactFields = ['pregnanciesAverted', 'maternalDeathsAverted', 'childDeathsAverted', 'abortionsAverted'];
    const sales = window.GSM_DATA.years.map((_, index) => sum(districts, district => district.sales[index]));
    const population = sum(districts, district => district.demographics.population);
    const population2026 = sum(districts, district => district.demographics.population2026);
    const fpUsers = sumObject(districts, 'fpUsers', fpFields);
    const beneficiaries = sumObject(districts, 'beneficiaries', beneficiaryFields);
    const selectedPartners = new Set(districts.flatMap(district => district.partners || []));
    return {
      population,
      population2026,
      mwra: sum(districts, district => district.demographics.mwra),
      mcpr: population ? sum(districts, district => district.demographics.mcpr * district.demographics.population) / population : 0,
      cyp: sumObject(districts, 'cyp', cypFields),
      network: sumObject(districts, 'network', networkFields),
      services: sumObject(districts, 'services', serviceFields),
      healthImpact: sumObject(districts, 'healthImpact', healthImpactFields),
      fpUsers,
      beneficiaries,
      sales,
      totalFpUsers: Object.values(fpUsers).reduce((total, value) => total + value, 0),
      avgSales: sales.reduce((total, value) => total + value, 0) / sales.length,
      annualBeneficiaries: Object.values(beneficiaries).reduce((total, value) => total + value, 0) / window.GSM_DATA.years.length,
      mwraRegistrations: sum(districts, district => district.mwraRegistrations),
      tbPatients: sum(districts, district => district.tbPatients),
      partners: window.GSM_DATA.partnerNames.filter(partner => selectedPartners.has(partner))
    };
  }

  function setValue(selector, value) {
    document.querySelectorAll(selector).forEach(element => { element.textContent = numberFormat.format(Math.round(value || 0)); });
  }

  function updateKpis(metrics) {
    const kpis = {
      population: metrics.population, population2026: metrics.population2026, mwra: metrics.mwra,
      totalCyp: metrics.cyp.total, cypCondom: metrics.cyp.condom, cypPills: metrics.cyp.pills, cypIud: metrics.cyp.iud, cypInjectables: metrics.cyp.injectables,
      totalNetwork: metrics.network.total, providers: metrics.network.providers, chemists: metrics.network.chemists, outlets: metrics.network.outlets, otherCadres: metrics.network.otherCadres,
      fpClients: metrics.services.fpClients, iudInsertions: metrics.services.iudInsertions, mva: metrics.services.mva, pacfp: metrics.services.pacfp, deliveries: metrics.services.deliveries,
      pregnanciesAverted: metrics.healthImpact.pregnanciesAverted, maternalDeathsAverted: metrics.healthImpact.maternalDeathsAverted,
      childDeathsAverted: metrics.healthImpact.childDeathsAverted, abortionsAverted: metrics.healthImpact.abortionsAverted
    };
    Object.entries(kpis).forEach(([key, value]) => setValue(`[data-kpi="${key}"]`, value));
    document.querySelectorAll('[data-kpi="mcpr"]').forEach(element => { element.textContent = `${(metrics.mcpr * 100).toFixed(1)}%`; });

    const summary = {
      avgSales: metrics.avgSales, annualBeneficiaries: metrics.annualBeneficiaries, totalFpUsers: metrics.totalFpUsers,
      condomUsers: metrics.fpUsers.condom, iudUsers: metrics.fpUsers.iud, pillsUsers: metrics.fpUsers.pills,
      injectableUsers: metrics.fpUsers.injectables, mwraRegistrations: metrics.mwraRegistrations, tbPatients: metrics.tbPatients
    };
    Object.entries(summary).forEach(([key, value]) => setValue(`[data-summary="${key}"]`, value));
  }

  function render(districts, state) {
    const metrics = aggregate(districts);
    updateKpis(metrics);
    window.GSM_CHARTS.update(metrics);
    window.GSM_MAP.update(districts);
    document.getElementById('footerDistrictCount').textContent = `${districts.length} district${districts.length === 1 ? '' : 's'}`;
    const footerPartners = document.getElementById('footerPartners');
    footerPartners.textContent = metrics.partners.length ? metrics.partners.join(' | ') : 'No partner data';
    footerPartners.title = metrics.partners.length ? `Programme partners: ${metrics.partners.join(', ')}` : 'No partner data for this selection';
  }

  function init() {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    window.GSM_CHARTS.init();
    window.GSM_MAP.init();
    window.GSM_FILTERS.init(render);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
