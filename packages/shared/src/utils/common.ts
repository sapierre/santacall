const hslToHex = (h: number, s: number, l: number) => {
  const a = (s * 100 * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const isExternal = (url: string) =>
  ["http", "https", "mailto", "tel", "//", "www"].some((protocol) =>
    url.startsWith(protocol),
  );

const mergeSearchParams = (
  target: URL,
  source: URL,
  options?: { overwrite?: boolean; replace?: boolean },
) => {
  const overwrite = options?.overwrite ?? false;
  const replace = options?.replace ?? false;

  if (replace) {
    target.search = source.search;
    return;
  }

  source.searchParams.forEach((value, key) => {
    if (overwrite || !target.searchParams.has(key)) {
      target.searchParams.set(key, value);
    }
  });
};

export { hslToHex, isExternal, mergeSearchParams };
export { default as capitalize } from "lodash/capitalize";
export { default as mapValues } from "lodash/mapValues";
export { default as pickBy } from "lodash/pickBy";
export { default as slugify } from "slugify";
