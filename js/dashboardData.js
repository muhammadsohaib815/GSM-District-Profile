(function () {
  'use strict';

  const numberFormat = new Intl.NumberFormat('en-PK');

  function setValue(selector, value) {
    document.querySelectorAll(selector).forEach(element => {
      element.textContent = value === null || value === undefined ? '-' : numberFormat.format(Math.round(value));
    });
  }

  function setPercent(selector, value) {
    document.querySelectorAll(selector).forEach(element => {
      element.textContent = value === null || value === undefined ? '-' : `${(value * 100).toFixed(1)}%`;
    });
  }

  function setPartners(partners) {
    const container = document.getElementById('partnerStripList');
    const active = Object.entries(partners || {})
      .filter(([, value]) => Number(value) === 1)
      .map(([name]) => name);
    container.replaceChildren();
    if (!active.length) {
      container.textContent = '-';
      return;
    }
    active.forEach((name, index) => {
      if (index) {
        const separator = document.createElement('b');
        separator.textContent = '|';
        container.append(separator);
      }
      container.append(document.createTextNode(name));
    });
  }

  async function update(state) {
    const query = new URLSearchParams();
    if (state.selectedProvinces.size === 1) query.set('province', [...state.selectedProvinces][0]);
    if (state.selectedDistricts.size === 1) query.set('district_id', [...state.selectedDistricts][0]);
    try {
      const response = await fetch(`/api/dashboard?${query}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const kpis = {
        population: data.population,
        mwra: data.mwra,
        totalCyp: data.cyp.total,
        cypCondom: data.cyp.condom,
        cypPills: data.cyp.pills,
        cypIud: data.cyp.iud,
        cypInjectables: data.cyp.injectables,
        cypVsc: data.cyp.vsc,
        cypImplant: data.cyp.implant,
        totalNetwork: data.network.total,
        providers: data.network.providers,
        chemists: data.network.chemists,
        outlets: data.network.outlets,
        mbbs: data.network.mbbs,
        lhvCmw: data.network.lhvCmw,
        hakeem: data.network.hakeem,
        nurse: data.network.nurse,
        fpClients: data.services.fpClients,
        iudInsertions: data.services.iudInsertions,
        mva: data.services.mva,
        pacfp: data.services.pacfp,
        deliveries: data.services.deliveries,
        pregnanciesAverted: data.healthImpact.pregnanciesAverted,
        maternalDeathsAverted: data.healthImpact.maternalDeathsAverted,
        childDeathsAverted: data.healthImpact.childDeathsAverted,
        abortionsAverted: data.healthImpact.abortionsAverted
      };
      Object.entries(kpis).forEach(([key, value]) => setValue(`[data-kpi="${key}"]`, value));
      setPercent('[data-kpi="mcpr"]', data.mcpr);

      const summaries = {
        // No Beneficiaries column exists in District Data.csv. Keep this
        // dashboard value unavailable instead of deriving it from Total Users.
        annualBeneficiaries: null,
        totalFpUsers: data.totalFpUsers,
        condomUsers: data.condomUsers,
        iudUsers: data.iudUsers,
        pillsUsers: data.pillsUsers,
        injectableUsers: data.injectableUsers,
        mwraRegistrations: data.mwraRegistrations,
        tbPatients: data.tbPatients
      };
      Object.entries(summaries).forEach(([key, value]) => setValue(`[data-summary="${key}"]`, value));
      setPartners(data.partners);
      window.GSM_CHARTS.update(data);
      document.getElementById('footerDistrictCount').textContent = `${data.record_count} district${data.record_count === 1 ? '' : 's'}`;
    } catch (error) {
      document.querySelectorAll('[data-kpi], [data-summary]').forEach(element => { element.textContent = '-'; });
      document.getElementById('partnerStripList').textContent = '-';
    }
  }

  window.GSM_DASHBOARD = { update };
})();
