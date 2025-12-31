/* worker-gis.js
   FINAL – Batch + Single mode + Progress
*/

let roads = null;

/* =========================
   LOAD ROADS.JSON (sekali)
========================= */
async function loadRoads() {
  if (roads) return roads;
  const res = await fetch("roads.json");
  roads = await res.json();
  return roads;
}

/* =========================
   UTIL GIS
========================= */
function toRad(d) {
  return d * Math.PI / 180;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* =========================
   HITUNG STA TERDEKAT
========================= */
function findNearestRoad(lat, lng, roads) {
  let best = {
    dist: Infinity,
    road: null,
    sta: null
  };

  roads.forEach(road => {
    let accDist = 0;

    for (let i = 0; i < road.polyline.length - 1; i++) {
      const [lng1, lat1] = road.polyline[i];
      const [lng2, lat2] = road.polyline[i + 1];

      const d1 = haversine(lat, lng, lat1, lng1);
      const d2 = haversine(lat, lng, lat2, lng2);
      const segLen = haversine(lat1, lng1, lat2, lng2);

      const minD = Math.min(d1, d2);

      if (minD < best.dist) {
        best.dist = minD;
        best.road = road;
        best.sta = road.sta_start + accDist;
      }

      accDist += segLen;
    }
  });

  return {
    ruas: best.road ? best.road.name : "Tidak diketahui",
    sta: best.road
      ? "STA " + Math.round(best.sta)
      : "-"
  };
}

/* =========================
   MESSAGE HANDLER
========================= */
onmessage = async function (e) {
  const roads = await loadRoads();

  /* ===== MODE SINGLE (refresh lokasi) ===== */
  if (e.data.mode === "single") {
    const { lat, lng } = e.data.point;
    const res = findNearestRoad(lat, lng, roads);
    postMessage(res);
    return;
  }

  /* ===== MODE BATCH (generate ruas) ===== */
  let data = e.data;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const res = findNearestRoad(d.lat, d.lng, roads);
    d.ruas = res.ruas;
    d.sta = res.sta;

    /* Progress setiap 10 titik */
    if (i % 10 === 0) {
      postMessage({
        progress: Math.round((i / data.length) * 100)
      });
    }
  }

  postMessage(data);
};
