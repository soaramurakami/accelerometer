let recording = false;
let data = []; // 記録データ
let watchId = null; // GPS用
let latestMotion = { x: 0, y: 0, z: 0 }; // 最新の加速度データ
let latestPosition = { latitude: 0, longitude: 0, speed: 0 }; // 最新のGPSデータ
let timerId = null; // タイマーID

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

  // タイマーでデータを統合し記録
  timerId = setInterval(recordData, 10000); // 10000ms間隔
});

function handleMotion(event) {
  const { x, y, z } = event.accelerationIncludingGravity || {};
  latestMotion = {
    x: x ?? 0, // データがなければ 0
    y: y ?? 0,
    z: z ?? 0
  };
}

function handlePosition(position) {
  const { latitude, longitude, speed } = position.coords;
  latestPosition = {
    latitude: latitude ?? 0, // データがなければ 0
    longitude: longitude ?? 0,
    speed: speed ?? 0
  };
}

function handleError(error) {
  console.error('GPS取得エラー:', error.message);
}

// タイマーで統合データを記録
function recordData() {
  // 緯度と経度が0の場合は保存しない
  if (latestPosition.latitude === 0 && latestPosition.longitude === 0) {
    return; // データをスキップ
  }

  const timestamp = getJSTTimestamp(); // 日本時間
  const record = {
    timestamp,
    x: latestMotion.x ?? 0, // nullまたはundefinedなら 0
    y: latestMotion.y ?? 0,
    z: latestMotion.z ?? 0,
    latitude: latestPosition.latitude ?? 0,
    longitude: latestPosition.longitude ?? 0,
    speed: latestPosition.speed ?? 0
  };
  data.push(record);

  // 表示更新
  document.getElementById('acc-x').textContent = record.x.toFixed(2);
  document.getElementById('acc-y').textContent = record.y.toFixed(2);
  document.getElementById('acc-z').textContent = record.z.toFixed(2);
  document.getElementById('gps-latitude').textContent = record.latitude.toFixed(6);
  document.getElementById('gps-longitude').textContent = record.longitude.toFixed(6);
  document.getElementById('gps-speed').textContent = record.speed.toFixed(2) + ' m/s';
}

function getJSTTimestamp() {
  const now = new Date();
  now.setHours(now.getHours() + 9); // UTC+9に変換
  return now.toISOString().replace('Z', '+09:00'); // タイムゾーンを明示
}

function generateFilename(extension) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}.${extension}`;
}

// CSV形式でデータを保存
function exportToCSV(data) {
  const filename = generateFilename('csv');
  const csv = ['timestamp,x,y,z,latitude,longitude,speed'];
  data.forEach(row => {
    csv.push(
      `${row.timestamp},${row.x},${row.y},${row.z},${row.latitude},${row.longitude},${row.speed}`
    );
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename; // ファイル名を設定
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// GPX形式でデータを保存
function exportToGPX(data) {
  const filename = generateFilename('gpx');
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CustomApp" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <trkseg>`;
  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  const gpxBody = data
    .map(row => 
      `<trkpt lat="${row.latitude}" lon="${row.longitude}">
        <time>${row.timestamp}</time>
        <speed>${row.speed}</speed>
      </trkpt>`
    )
    .join('\n');

  const gpx = gpxHeader + gpxBody + gpxFooter;
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename; // ファイル名を設定
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 計測終了時の処理
document.getElementById('stop-btn').addEventListener('click', () => {
  if (!recording) return;
  recording = false;
  document.getElementById('status').textContent = '状態: 停止中';
  document.getElementById('start-btn').disabled = false;
  document.getElementById('stop-btn').disabled = true;

  // イベントリスナーとGPSウォッチを解除
  window.removeEventListener('devicemotion', handleMotion);
  if (watchId) navigator.geolocation.clearWatch(watchId);

  // タイマー停止
  if (timerId) clearInterval(timerId);

  // データをCSVとGPXで保存
  exportToCSV(data);
  exportToGPX(data);
});
