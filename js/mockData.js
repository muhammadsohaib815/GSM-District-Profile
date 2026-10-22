(function () {
  'use strict';

  const YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const PROVINCES = ['AJK', 'Balochistan', 'Islamabad', 'KPK', 'Punjab', 'Sindh'];
  const SALES_INDEX = [0.31, 0.38, 0.49, 0.64, 0.82, 1.04, 1.22, 1.47, 1.55, 1.67];
  const PARTNER_NAMES = ['KFW', 'LAD', 'FCDO', 'GF', 'BMGF', 'USAID', 'Packard', 'PPIF', 'Other'];
  const PARTNERS_BY_PROVINCE = {
    AJK: ['KFW', 'FCDO', 'Other'],
    Balochistan: ['USAID', 'BMGF', 'GF'],
    Islamabad: ['FCDO', 'Packard', 'PPIF'],
    KPK: ['KFW', 'GF', 'USAID'],
    Punjab: ['LAD', 'PPIF', 'Packard', 'BMGF'],
    Sindh: ['USAID', 'GF', 'BMGF', 'Other']
  };

  // Population and coordinates are rounded district/city-level context values only.
  // All programme metrics are deterministic fictional demonstration data.
  const DISTRICT_SEEDS = [
    ['Muzaffarabad','AJK',34.37,73.47,650000,1.021,0.28,0.82],
    ['Mirpur','AJK',33.15,73.75,520000,1.019,0.31,0.76],
    ['Kotli','AJK',33.52,73.90,790000,1.020,0.27,0.71],
    ['Quetta','Balochistan',30.18,66.98,2260000,1.030,0.24,1.12],
    ['Gwadar','Balochistan',25.12,62.33,310000,1.034,0.21,0.72],
    ['Kech','Balochistan',26.00,63.05,910000,1.027,0.22,0.68],
    ['Khuzdar','Balochistan',27.80,66.62,1000000,1.025,0.23,0.65],
    ['Islamabad','Islamabad',33.69,73.04,2360000,1.034,0.42,1.36],
    ['Peshawar','KPK',34.01,71.58,4750000,1.029,0.31,1.22],
    ['Abbottabad','KPK',34.15,73.22,1500000,1.023,0.37,1.04],
    ['Swat','KPK',35.22,72.43,2690000,1.028,0.27,0.94],
    ['Mardan','KPK',34.20,72.05,2750000,1.026,0.30,1.08],
    ['Bannu','KPK',32.99,70.61,1360000,1.030,0.25,0.77],
    ['Lahore','Punjab',31.52,74.36,13500000,1.026,0.41,1.55],
    ['Rawalpindi','Punjab',33.57,73.00,6110000,1.025,0.40,1.36],
    ['Faisalabad','Punjab',31.42,73.08,9070000,1.024,0.38,1.42],
    ['Multan','Punjab',30.20,71.47,5360000,1.026,0.36,1.25],
    ['Gujranwala','Punjab',32.16,74.19,6010000,1.024,0.39,1.31],
    ['Bahawalpur','Punjab',29.40,71.68,4100000,1.027,0.33,1.06],
    ['Sialkot','Punjab',32.49,74.53,4490000,1.022,0.40,1.18],
    ['Sargodha','Punjab',32.08,72.67,4100000,1.023,0.35,1.02],
    ['Karachi','Sindh',24.86,67.01,20300000,1.030,0.43,1.72],
    ['Hyderabad','Sindh',25.40,68.37,2690000,1.027,0.39,1.23],
    ['Sukkur','Sindh',27.71,68.86,1650000,1.025,0.34,1.02],
    ['Larkana','Sindh',27.56,68.21,1790000,1.026,0.31,0.96],
    ['Thatta','Sindh',24.75,67.92,1150000,1.028,0.26,0.75],
    ['Badin','Sindh',24.66,68.84,1950000,1.027,0.29,0.82]
  ];

  function buildDistrict(seed, index) {
    const [name, province, lat, lng, population, growth, mcpr, weight] = seed;
    const factor = weight * (0.94 + (index % 5) * 0.035);
    const popScale = population / 1000000;
    const provincePartners = PARTNERS_BY_PROVINCE[province];
    const partnerOffset = index % provincePartners.length;
    const partners = [
      provincePartners[partnerOffset],
      provincePartners[(partnerOffset + 1) % provincePartners.length]
    ];
    if (index % 3 === 0) partners.push(provincePartners[(partnerOffset + 2) % provincePartners.length]);
    const fpTotal = Math.round((population * mcpr * 0.43) + factor * 28500);
    const fpMix = { condom: 0.48, pills: 0.20, iud: 0.12, injectables: 0.11, implant: 0.07, vsc: 0.02 };
    const fpUsers = {};
    let assigned = 0;
    Object.entries(fpMix).forEach(([key, ratio], mixIndex, entries) => {
      const value = mixIndex === entries.length - 1 ? fpTotal - assigned : Math.round(fpTotal * ratio);
      fpUsers[key] = value;
      assigned += value;
    });

    const cyp = {
      condom: Math.round(fpUsers.condom * 0.0083),
      pills: Math.round(fpUsers.pills * 0.067),
      iud: Math.round(fpUsers.iud * 2.7),
      injectables: Math.round(fpUsers.injectables * 0.25)
    };
    cyp.total = cyp.condom + cyp.pills + cyp.iud + cyp.injectables;

    const providers = Math.round(68 * factor + popScale * 10);
    const network = {
      providers,
      chemists: Math.round(175 * factor + popScale * 21),
      outlets: Math.round(134 * factor + popScale * 16),
      otherCadres: Math.round(47 * factor + popScale * 6)
    };
    network.total = network.providers + network.chemists + network.outlets + network.otherCadres;

    const services = {
      fpClients: Math.round(fpTotal * 1.37),
      iudInsertions: fpUsers.iud,
      mva: Math.round(population * 0.0031 * factor),
      pacfp: Math.round(population * 0.0027 * factor),
      deliveries: Math.round(population * 0.016 * factor)
    };

    const healthImpact = {
      pregnanciesAverted: Math.round(fpTotal * 0.33),
      maternalDeathsAverted: Math.round(fpTotal * 0.00042),
      childDeathsAverted: Math.round(fpTotal * 0.0028),
      abortionsAverted: Math.round(fpTotal * 0.095)
    };

    const beneficiaries = {
      fpClients: services.fpClients,
      nfpUsers: Math.round(fpTotal * 0.42),
      deliveries: services.deliveries,
      ipc: Math.round(population * 0.028 * factor),
      tb: Math.round(population * 0.0019 * factor),
      other: Math.round(fpTotal * 0.11)
    };

    const sales = YEARS.map((year, yearIndex) => Math.round((popScale * 24 + factor * 19) * SALES_INDEX[yearIndex] * 1000000));
    const locations = Array.from({ length: Math.max(2, Math.round(3 + factor * 4)) }, (_, markerIndex) => {
      const angle = ((markerIndex * 137.5) + index * 23) * Math.PI / 180;
      const radius = 0.035 + (markerIndex % 4) * 0.025;
      return {
        id: `${province}-${name}-${markerIndex + 1}`.replace(/\s+/g, '-').toLowerCase(),
        name: `${name} demo service point ${markerIndex + 1}`,
        lat: +(lat + Math.sin(angle) * radius).toFixed(4),
        lng: +(lng + Math.cos(angle) * radius).toFixed(4),
        type: ['Provider', 'Chemist', 'Outlet'][markerIndex % 3]
      };
    });

    return {
      id: `${province}-${name}`.replace(/\s+/g, '-').toLowerCase(), name, province, lat, lng,
      demographics: { population, population2026: Math.round(population * Math.pow(growth, 3)), mwra: Math.round(population * Math.pow(growth, 3) * 0.228), mcpr },
      cyp, network, services, healthImpact, fpUsers, beneficiaries, sales, locations, partners: [...new Set(partners)],
      mwraRegistrations: beneficiaries.ipc,
      tbPatients: beneficiaries.tb
    };
  }

  const districts = DISTRICT_SEEDS.map(buildDistrict);
  window.GSM_DATA = { years: YEARS, provinces: PROVINCES, partnerNames: PARTNER_NAMES, districts };
})();
