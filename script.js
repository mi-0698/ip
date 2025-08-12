// script.js
// IP -> geolocation demo using ipapi.co, Leaflet map and Chart.js
// 注意: ipapi.co は匿名で使えるがレート制限があります。必要に応じて別APIへ差し替えてください。

const API_URL = 'https://ipapi.co/json/';

async function fetchIpInfo(){
  try{
    const res = await fetch(API_URL, {cache: "no-store"});
    if(!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data;
  }catch(e){
    console.error('fetchIpInfo error', e);
    return null;
  }
}

function updateInfoTable(data){
  document.getElementById('ip').textContent = data.ip || '—';
  document.getElementById('country').textContent = data.country_name || data.country || '—';
  document.getElementById('region').textContent = data.region || '—';
  document.getElementById('city').textContent = data.city || '—';
  document.getElementById('latlon').textContent = (data.latitude && data.longitude) ? `${data.latitude}, ${data.longitude}` : '—';
  document.getElementById('timezone').textContent = data.timezone || '—';
  document.getElementById('org').textContent = data.org || data.network || '—';
}

function initMap(lat, lon, label){
  // center the map on the coordinates
  const map = L.map('map', {zoomControl: true}).setView([lat, lon], 6);

  // OSM tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // marker + accuracy circle (radius optional)
  const marker = L.marker([lat, lon]).addTo(map).bindPopup(label).openPopup();

  // optional small circle to show approximate area
  const circle = L.circle([lat, lon], {radius: 20000, color: '#60a5fa', weight:1, fillOpacity:0.05}).addTo(map);

  // adjust zoom if lat/lon are broad (e.g., city-level)
  return {map, marker, circle};
}

function drawCharts(lat, lon){
  // Scatter: longitude (x) vs latitude (y)
  const ctxS = document.getElementById('latlonScatter').getContext('2d');
  new Chart(ctxS, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Your location (lon, lat)',
        data: [{x: lon, y: lat}],
        pointRadius: 8,
        showLine: false
      }]
    },
    options: {
      scales: {
        x: {type: 'linear', position: 'bottom', title: {display:true, text:'経度 (Longitude)'}},
        y: {title: {display:true, text:'緯度 (Latitude)'}}
      },
      plugins: {legend:{display:false}}
    }
  });

  // Bars: compare numeric values (lat vs lon)
  const ctxB = document.getElementById('latlonBars').getContext('2d');
  new Chart(ctxB, {
    type: 'bar',
    data: {
      labels: ['Latitude', 'Longitude'],
      datasets: [{
        label: '数値',
        data: [lat, lon],
        barThickness: 40
      }]
    },
    options: {
      plugins: {legend:{display:false}},
      scales: {
        y: {beginAtZero:false}
      }
    }
  });
}

(async function main(){
  const raw = await fetchIpInfo();
  if(!raw){
    alert('IP情報の取得に失敗しました。APIがブロックされているか、ネットワークエラーです。コンソールを確認してください。');
    return;
  }

  // ipapi returns latitude / longitude property names: latitude, longitude (strings or numbers)
  const lat = parseFloat(raw.latitude ?? raw.lat ?? raw.latitude && raw.latitude);
  const lon = parseFloat(raw.longitude ?? raw.lon ?? raw.longitude && raw.longitude);

  updateInfoTable(raw);

  if(!Number.isFinite(lat) || !Number.isFinite(lon)){
    // API didn't return coordinates
    document.getElementById('map').textContent = '座標情報が取得できませんでした。';
    return;
  }

  initMap(lat, lon, `${raw.city || '不明な都市'}, ${raw.country_name || raw.country}`);
  drawCharts(lat, lon);
})();
