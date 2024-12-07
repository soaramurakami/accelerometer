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
