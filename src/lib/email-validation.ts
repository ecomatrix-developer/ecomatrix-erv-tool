/**
 * Email format validation. A plain shape-check regex (name@domain.anything) cannot
 * catch a typo like "test@gmail.comm" -- it's syntactically well-formed, just not a
 * real TLD. So on top of the shape check:
 *  1. The domain is compared against a list of major email providers (gmail, yahoo,
 *     outlook, etc). If it's close (Levenshtein distance 1-2) to one of those but not
 *     an exact match, it's almost certainly a typo ("gmial.com", "gnail.com",
 *     "gmail.comm", "yahooo.com") and gets rejected with a suggested correction.
 *  2. Otherwise, the final domain label (TLD) is matched against a list of real
 *     top-level domains, to catch non-provider typos like "mycompany.comm".
 * This is a pragmatic stopgap, not true verification (it can't confirm the mailbox
 * exists or is owned by the signer-up) -- only actually emailing a confirmation code
 * could do that. Extend the lists below if a legitimate signup gets rejected.
 */
const EMAIL_SHAPE_REGEX = /^([^\s@]+)@([^\s@]+\.[a-zA-Z]{2,24})$/;

const MAJOR_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "mail.com",
  "rediffmail.com",
];

const VALID_TLDS = new Set([
  // Generic
  "com", "net", "org", "info", "biz", "name", "pro", "mobi", "tel", "travel",
  "jobs", "coop", "museum", "aero", "xxx", "asia", "cat",
  // Sponsored / institutional
  "edu", "gov", "mil", "int",
  // Common newer gTLDs
  "io", "co", "me", "tv", "cc", "dev", "app", "ai", "xyz", "online", "site",
  "tech", "store", "cloud", "email", "agency", "solutions", "services",
  "systems", "software", "digital", "studio", "design", "media", "news",
  "live", "life", "world", "today", "group", "team", "work", "club",
  "company", "expert", "guide", "guru", "health", "help", "home", "host",
  "finance", "fund", "capital", "ventures", "consulting", "global", "network",
  "shop", "market", "run", "page", "link", "click", "space", "website", "blog",
  // Country-code TLDs (most common)
  "us", "uk", "ca", "au", "de", "fr", "es", "it", "nl", "se", "no", "dk", "fi",
  "pl", "pt", "ch", "at", "be", "ie", "nz", "in", "jp", "kr", "cn", "hk", "sg",
  "tw", "th", "vn", "id", "my", "ph", "ae", "sa", "il", "tr", "ru", "ua", "br",
  "mx", "ar", "cl", "pe", "za", "ng", "ke", "eg", "gr", "cz", "hu", "ro", "bg",
  "sk", "si", "lt", "lv", "ee", "is", "lu", "mt", "cy",
]);

/** Classic edit-distance (insert/delete/substitute), one row at a time. */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(Math.min(currentRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost));
    }
    prevRow = currentRow;
  }
  return prevRow[b.length];
}

export interface EmailValidationResult {
  valid: boolean;
  /** Set when the domain looks like a near-miss typo of a major provider. */
  suggestedDomain?: string;
}

export function validateEmailFormat(email: string): EmailValidationResult {
  const match = EMAIL_SHAPE_REGEX.exec(email);
  if (!match) return { valid: false };

  const domain = match[2].toLowerCase();

  if (MAJOR_EMAIL_DOMAINS.includes(domain)) {
    return { valid: true };
  }

  // Close-but-not-exact match to a major provider domain => almost certainly a typo.
  let closest: { domain: string; distance: number } | null = null;
  for (const majorDomain of MAJOR_EMAIL_DOMAINS) {
    // Skip comparisons where the length difference alone rules out a close match.
    if (Math.abs(domain.length - majorDomain.length) > 2) continue;
    const distance = levenshteinDistance(domain, majorDomain);
    if (!closest || distance < closest.distance) {
      closest = { domain: majorDomain, distance };
    }
  }
  if (closest && closest.distance > 0 && closest.distance <= 2) {
    return { valid: false, suggestedDomain: closest.domain };
  }

  const tld = domain.split(".").pop() ?? "";
  return { valid: VALID_TLDS.has(tld) };
}

export function isValidEmailFormat(email: string): boolean {
  return validateEmailFormat(email).valid;
}
