let recording = false;
let data = []; // 記録データ
let watchId = null; // GPS用
let latestMotion = { x: null, y: null, z: null }; // 最新の加速度データ
let latestPosition = { latitude: null, longitude: null, speed: null }; // 最新のGPSデータ
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
  timerId = setInterval(recordData, 100); // 100ms間隔
});

function handleMotion(event) {
  const { x, y, z } = event.accelerationIncludingGravity || {};
  latestMotion = { x: x || 0, y: y || 0, z: z || 0 }; // 最新の加速度データを保持
}

function handlePosition(position) {
  const { latitude, longitude, speed } = position.coords;
  latestPosition = {
    latitude: latitude || 0,
    longitude: longitude || 0,
    speed: speed || 0
  }; // 最新のGPSデータを保持
}

function handleError(error) {
  console.error('GPS取得エラー:', error.message);
}

// タイマーで統合データを記録
function recordData() {
  const timestamp = getJSTTimestamp(); // 日本時間
  const record = {
    timestamp,
    x: latestMotion.x,
    y: latestMotion.y,
    z: latestMotion.z,
    latitude: latestPosition.latitude,
    longitude: latestPosition.longitude,
    speed: latestPosition.speed
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

// 日本時間に変換する関数
function getJSTTimestamp() {
  const now = new Date();
  now.setHours(now.getHours() + 9); // UTC+9に変換
  return now.toISOString().replace('Z', '+09:00'); // タイムゾーンを明示
}
