// src/utils/url.utils.ts
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.protocol = 'https:';

    // Remove tracking parameters that make URLs look different
    const paramsToRemove = [
      'click_id',
      'gclid',
      'fbclid',
      'source',
      'spm',
      'scm',
    ];
    paramsToRemove.forEach((param) => urlObj.searchParams.delete(param));

    // Aggressive strip for Daraz (optional but recommended)
    if (url.includes('daraz.pk')) {
      return url.split('?')[0];
    }

    return urlObj.toString();
  } catch (e) {
    return url;
  }
}
