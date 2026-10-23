export const SITE_ELIGIBILITY_POLICY='nocturne-adult-non-highschool-2026-10-22';
export const ELIGIBILITY_MAX_AGE=30*86400000;
export const ELIGIBILITY_COOKIE='nocturne_eligibility';
export const eligibilityRequired=path=>!['/privacy/','/advertising/'].includes(path);
