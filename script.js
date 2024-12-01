let recording = false;
let data = []; // 記録データ
let watchId = null; // GPS用

// 計測開始ボタンの処理
document.getElementById('start-btn').addEventListener('click', () => {
  if (recording) return;
  recording = true;
  data = [];
  document.getElementById('status').textContent = '状態: 計測中';
  document.getElementById('start-btn').disabled = true;
  document.getElementById('stop-btn').disabled = false;

  // 加速度センサーの取得
  window.addEventListener('devicemotion', handleMotion);

  // GPS情報の取得
  watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
    enableHighAccuracy: true,
  });
});

function handleMotion(event) {
  const { x, y, z } = event.accelerationIncludingGravity || {};
  const timestamp = new Date().toISOString();

  // データを記録
  data.push({ timestamp, x, y, z });

  // 値を表示
  document.getElementById('acc-x').textContent = x?.toFixed(2) || '-';
  document.getElementById('acc-y').textContent = y?.toFixed(2) || '-';
  document.getElementById('acc-z').textContent = z?.toFixed(2) || '-';
}

function handlePosition(position) {
  const { latitude, longitude, speed } = position.coords;
  const timestamp = new Date().toISOString();

  // データを記録
  data.push({ timestamp, latitude, longitude, speed });

  // 値を表示
  document.getElementById('gps-latitude').textContent = latitude?.toFixed(6) || '-';
  document.getElementById('gps-longitude').textContent = longitude?.toFixed(6) || '-';
  document.getElementById('gps-speed').textContent = speed ? speed.toFixed(2) + ' m/s' : '-';
}

function handleError(error) {
  console.error('GPS取得エラー:', error.message);
}

// 計測終了ボタンの処理
document.getElementById('stop-btn').addEventListener('click', () => {
  if (!recording) return;
  recording = false;
  document.getElementById('status').textContent = '状態: 停止中';
  document.getElementById('start-btn').disabled = false;
  document.getElementById('stop-btn').disabled = true;

  // イベントリスナーとGPSウォッチを解除
  window.removeEventListener('devicemotion', handleMotion);
  if (watchId) navigator.geolocation.clearWatch(watchId);

  // データをCSVとGPXで保存
  exportToCSV(data);
  exportToGPX(data);
});

function exportToCSV(data) {
  const csv = ['timestamp,x,y,z,latitude,longitude,speed'];
  data.forEach(row => {
    csv.push(
      `${row.timestamp || ''},${row.x || ''},${row.y || ''},${row.z || ''},${row.latitude || ''},${row.longitude || ''},${row.speed || ''}`
    );
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportToGPX(data) {
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CustomApp" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <trkseg>`;
  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  const gpxBody = data
    .filter(row => row.latitude && row.longitude)
    .map(
      row =>
        `<trkpt lat="${row.latitude}" lon="${row.longitude}">
          <time>${row.timestamp}</time>
          ${row.speed ? `<speed>${row.speed}</speed>` : ''}
        </trkpt>`
    )
    .join('\n');

  const gpx = gpxHeader + gpxBody + gpxFooter;
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.gpx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
