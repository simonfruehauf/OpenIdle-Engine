export function formatNumber(n: number, opts?: { decimals?: number; abbreviate?: boolean }): string {
  const decimals = opts?.decimals ?? 1;
  const abbreviate = opts?.abbreviate ?? true;
  if (!isFinite(n)) return "0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abbreviate) {
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(decimals)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
    if (abs >= 1e4) return `${sign}${(abs / 1e3).toFixed(decimals)}K`;
  }
  if (abs >= 100) return `${sign}${abs.toFixed(0)}`;
  if (abs >= 10) return `${sign}${abs.toFixed(1)}`;
  return `${sign}${abs.toFixed(decimals)}`;
}

export function formatRate(n: number): string {
  const abs = Math.abs(n);
  const sign = n > 0 ? "+" : "";
  if (abs >= 1e6) return `${sign}${(n / 1e6).toFixed(2)}M/s`;
  if (abs >= 1e3) return `${sign}${(n / 1e3).toFixed(2)}K/s`;
  if (abs >= 1) return `${sign}${n.toFixed(2)}/s`;
  if (abs >= 0.01) return `${sign}${n.toFixed(2)}/s`;
  return `${sign}${n.toFixed(3)}/s`;
}
