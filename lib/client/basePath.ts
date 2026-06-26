export const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export function withBasePath(path: string) {
  if (!APP_BASE_PATH || /^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === APP_BASE_PATH || normalized.startsWith(`${APP_BASE_PATH}/`)) return normalized;
  return `${APP_BASE_PATH}${normalized}`;
}

export function stripBasePath(pathname: string) {
  if (!APP_BASE_PATH) return pathname;
  if (pathname === APP_BASE_PATH) return "/";
  if (pathname.startsWith(`${APP_BASE_PATH}/`)) return pathname.slice(APP_BASE_PATH.length) || "/";
  return pathname;
}
