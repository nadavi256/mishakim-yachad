/** Navigation from stored coordinates. Web URLs fall back when the native app is missing. */
export function mapsLinks(lat: number, lon: number): { google: string; waze: string } {
  const q = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    waze: `https://waze.com/ul?ll=${q}&navigate=yes`,
  };
}

export function activityShareUrl(activityId: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${window.location.origin}${base}#/activity/${activityId}`;
}
