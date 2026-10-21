(function () {
  'use strict';

  let map;
  let markerLayer;
  let boundaryLayer;
  let resizeObserver;
  const pakistanBounds = [[23.4, 60.8], [37.2, 77.9]];

  function init() {
    const mapElement = document.getElementById('pakistanMap');
    if (!window.L) {
      mapElement.innerHTML = '<p class="empty-filter">The interactive map requires an internet connection to load Leaflet.</p>';
      return;
    }
    map = L.map(mapElement, { zoomControl: true, minZoom: 4, maxZoom: 16, maxBounds: [[20, 57], [39, 81]], attributionControl: true });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, OpenStreetMap contributors, and the GIS User Community'
    }).addTo(map);
    markerLayer = typeof L.markerClusterGroup === 'function'
      ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 38, spiderfyOnMaxZoom: true })
      : L.layerGroup();
    markerLayer.addTo(map);
    map.fitBounds(pakistanBounds, { padding: [8, 8] });
    if ('ResizeObserver' in window) {
      let resizeFrame;
      resizeObserver = new ResizeObserver(() => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      });
      resizeObserver.observe(mapElement);
    }
  }

  function update(districts) {
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    const markers = [];
    districts.forEach(district => {
      district.locations.forEach(location => {
        const icon = L.divIcon({ className: '', html: '<div class="demo-marker"></div>', iconSize: [12, 12], iconAnchor: [6, 6] });
        const marker = L.marker([location.lat, location.lng], { icon });
        marker.bindPopup(`<div class="map-popup"><h3>${district.name}</h3><p><strong>${location.type}</strong> · ${district.province}</p><p>${location.name}</p><p>Illustrative location only</p></div>`);
        markerLayer.addLayer(marker);
        markers.push(marker);
      });
    });
    document.getElementById('mapLocationCount').textContent = markers.length.toLocaleString();
    if (markers.length) {
      const bounds = L.featureGroup(markers).getBounds();
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: districts.length === 1 ? 9 : 7 });
    } else {
      map.fitBounds(pakistanBounds, { padding: [8, 8] });
    }
    window.setTimeout(() => map.invalidateSize(), 80);
  }

  // Future API integration point: pass a Pakistan district FeatureCollection here.
  function setBoundaryGeoJSON(geoJson) {
    if (!map || !window.L) return;
    if (boundaryLayer) boundaryLayer.remove();
    if (!geoJson) return;
    boundaryLayer = L.geoJSON(geoJson, {
      style: { color: '#0d5e77', weight: 1, opacity: 0.65, fillColor: '#5eb899', fillOpacity: 0.08 },
      onEachFeature(feature, layer) {
        const label = feature.properties && (feature.properties.district || feature.properties.name);
        if (label) layer.bindTooltip(label, { sticky: true });
      }
    }).addTo(map);
    boundaryLayer.bringToBack();
  }

  window.GSM_MAP = { init, update, setBoundaryGeoJSON };
})();
