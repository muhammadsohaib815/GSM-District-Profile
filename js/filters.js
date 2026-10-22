(function () {
  'use strict';

  const catalog = { provinces: [], districts: [] };
  const state = { selectedProvinces: new Set(), selectedDistricts: new Set(), search: '' };
  let onChange = function () {};

  const els = {};

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function optionMarkup(id, name, value, label, checked, extra, className) {
    return `<label class="check-option ${className || ''}" for="${escapeHtml(id)}"><input id="${escapeHtml(id)}" name="${escapeHtml(name)}" type="radio" value="${escapeHtml(value)}" ${checked ? 'checked' : ''}><span>${escapeHtml(label)}</span>${extra || ''}</label>`;
  }

  function availableDistricts() {
    return catalog.districts.filter(district => state.selectedProvinces.has(district.province));
  }

  function selectedData() {
    // The CSV currently contains TP values only. Keep unsupported dashboard
    // metrics empty so the UI renders a dash instead of demonstration data.
    return [];
  }

  function renderProvinces() {
    const allSelected = state.selectedProvinces.size === catalog.provinces.length;
    const allOption = optionMarkup('province-all', 'province', '__all__', 'All provinces', allSelected, '', 'all-option');
    const provinceOptions = catalog.provinces.map((province, index) =>
      optionMarkup(`province-${index}`, 'province', province, province, state.selectedProvinces.size === 1 && state.selectedProvinces.has(province))
    ).join('');
    els.provinceFilters.innerHTML = allOption + provinceOptions;
    els.provinceCount.textContent = allSelected ? 'All' : [...state.selectedProvinces][0];
  }

  function renderDistricts() {
    const available = availableDistricts();
    const query = state.search.trim().toLowerCase();
    const visible = available.filter(district => district.name.toLowerCase().includes(query));
    const allOption = optionMarkup('district-all', 'district', '__all__', 'All districts', !state.selectedDistricts.size, '', 'all-option');
    const districtOptions = visible.length ? visible.map(district =>
      optionMarkup(`district-${district.id}`, 'district', district.id, district.name, state.selectedDistricts.has(district.id), `<small>${escapeHtml(district.province)}</small>`)
    ).join('') : '<div class="empty-filter">No districts match your search.</div>';
    els.districtFilters.innerHTML = allOption + districtOptions;
    const selectedCount = state.selectedDistricts.size
      ? available.filter(district => state.selectedDistricts.has(district.id)).length
      : available.length;
    els.districtCount.textContent = state.selectedDistricts.size ? '1 selected' : 'All';
    els.visibleDistricts.textContent = selectedCount;
  }

  function emit() {
    renderProvinces();
    renderDistricts();
    onChange(selectedData(), state);
  }

  function openPanel(open) {
    els.panel.classList.toggle('open', open);
    els.backdrop.classList.toggle('show', open);
    document.body.classList.toggle('filter-open', open);
    els.mobileButton.setAttribute('aria-expanded', String(open));
  }

  function init(changeHandler) {
    onChange = changeHandler;
    Object.assign(els, {
      provinceFilters: document.getElementById('provinceFilters'), districtFilters: document.getElementById('districtFilters'),
      provinceCount: document.getElementById('provinceCount'), districtCount: document.getElementById('districtCount'),
      visibleDistricts: document.getElementById('visibleDistricts'), search: document.getElementById('districtSearch'),
      panel: document.getElementById('filterPanel'), backdrop: document.getElementById('filterBackdrop'),
      mobileButton: document.getElementById('mobileFilterBtn')
    });

    els.provinceFilters.addEventListener('change', event => {
      if (!event.target.matches('input[type="radio"]')) return;
      state.selectedProvinces = event.target.value === '__all__'
        ? new Set(catalog.provinces)
        : new Set([event.target.value]);
      state.selectedDistricts.clear();
      emit();
    });
    els.districtFilters.addEventListener('change', event => {
      if (!event.target.matches('input[type="radio"]')) return;
      state.selectedDistricts = event.target.value === '__all__'
        ? new Set()
        : new Set([event.target.value]);
      emit();
    });
    els.search.addEventListener('input', event => { state.search = event.target.value; renderDistricts(); });
    document.getElementById('resetFilters').addEventListener('click', reset);
    els.mobileButton.addEventListener('click', () => openPanel(true));
    document.getElementById('closeFilter').addEventListener('click', () => openPanel(false));
    document.getElementById('applyMobileFilters').addEventListener('click', () => openPanel(false));
    els.backdrop.addEventListener('click', () => openPanel(false));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') openPanel(false); });
    fetch('/api/tp-values/meta')
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(data => {
        catalog.provinces = data.provinces;
        catalog.districts = data.districts;
        state.selectedProvinces = new Set(catalog.provinces);
        emit();
      })
      .catch(() => {
        els.provinceFilters.innerHTML = '<div class="empty-filter">Start the dashboard with python server.py.</div>';
        els.districtFilters.innerHTML = '<div class="empty-filter">CSV data is unavailable.</div>';
        onChange([], state);
      });
  }

  function reset() {
    state.selectedProvinces = new Set(catalog.provinces);
    state.selectedDistricts.clear();
    state.search = '';
    if (els.search) els.search.value = '';
    emit();
  }

  window.GSM_FILTERS = { init, reset };
})();
