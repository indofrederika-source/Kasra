import dns from 'node:dns/promises';

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'pokemail.net',
  'spam4.me',
  'trashmail.com',
  'trashmail.net',
  'getnada.com',
  'nada.email',
  'maildrop.cc',
  'dispostable.com',
  'mohmal.com',
  'fakeinbox.com',
  'throwawaymail.com',
  'mailnesia.com',
  'mintemail.com',
  'mytemp.email',
  'tempail.com',
  'tempr.email',
  'discard.email',
  'emailondeck.com',
  'burnermail.io',
  'inboxkitten.com',
  'mailsac.com',
  'harakirimail.com',
  'mailcatch.com',
  'jetable.org',
  'crazymailing.com',
  'generator.email',
  'emltmp.com',
]);

const RESERVED_OR_FAKE_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'testing.com',
  'localhost',
  'invalid',
  'local',
  'domain.com',
  'email.com',
  'sample.com',
  'ngasal.com',
  'asal.com',
  'palsu.com',
  'fake.com',
  'none.com',
  'abc.com',
  'xyz.com',
  'qwerty.com',
  'asdf.com',
]);

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.id': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'icloud.co': 'icloud.com',
};

const OBVIOUS_FAKE_LOCAL_PARTS = new Set([
  'test',
  'testing',
  'tester',
  'coba',
  'cobain',
  'percobaan',
  'ngasal',
  'asal',
  'asalan',
  'palsu',
  'fake',
  'dummy',
  'sample',
  'contoh',
  'qwerty',
  'qwertyuiop',
  'asdf',
  'asdfgh',
  'asdfghjkl',
  'zxcvbn',
  'zxcvbnm',
  'abcdef',
  'abcdefgh',
  '12345',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  'none',
  'null',
  'tidakada',
]);

const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), ms)
    ),
  ]);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!rawEmail) {
      return Response.json(
        { valid: false, reason: 'Alamat email wajib diisi.' },
        { status: 400 }
      );
    }

    if (rawEmail.includes('..') || !STRICT_EMAIL_REGEX.test(rawEmail)) {
      return Response.json({
        valid: false,
        reason: 'Format alamat email tidak valid. Contoh yang benar: namatoko@gmail.com.',
      });
    }

    const [localPart, domain] = rawEmail.split('@');
    if (!localPart || !domain || localPart.length < 2) {
      return Response.json({
        valid: false,
        reason: 'Nama pengguna email terlalu pendek atau tidak valid.',
      });
    }

    if (OBVIOUS_FAKE_LOCAL_PARTS.has(localPart.toLowerCase())) {
      return Response.json({
        valid: false,
        reason: `Alamat email "${rawEmail}" terdeteksi sebagai akun percobaan/ngasal. Gunakan email pribadi atau bisnis asli Anda.`,
      });
    }

    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1] || '';
    if (!/^[a-z]{2,24}$/.test(tld)) {
      return Response.json({
        valid: false,
        reason: `Akhiran domain ".${tld}" tidak valid. Gunakan email aktif yang benar.`,
      });
    }

    // 1. Typo check for popular providers
    if (COMMON_DOMAIN_TYPOS[domain]) {
      const suggested = `${localPart}@${COMMON_DOMAIN_TYPOS[domain]}`;
      return Response.json({
        valid: false,
        suggestion: suggested,
        reason: `Domain "@${domain}" sepertinya salah ketik. Apakah maksud Anda "${suggested}"?`,
      });
    }

    // 2. Block reserved / obvious fake domains
    if (RESERVED_OR_FAKE_DOMAINS.has(domain)) {
      return Response.json({
        valid: false,
        reason: `Domain "@${domain}" tidak dapat digunakan. Gunakan alamat email asli milik Anda yang aktif.`,
      });
    }

    // 3. Block disposable / temporary burner emails
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      return Response.json({
        valid: false,
        reason:
          'Email sekali pakai (disposable/temp mail) tidak diizinkan. Gunakan email pribadi atau bisnis resmi Anda.',
      });
    }

    // 4. Real DNS MX Record Lookup — proves the domain truly exists & receives email
    try {
      const mxRecords = await withTimeout(dns.resolveMx(domain), 3500);
      const validMx = (mxRecords || []).filter(
        (r) => r && typeof r.exchange === 'string' && r.exchange.trim() !== '' && r.exchange.trim() !== '.'
      );

      if (validMx.length === 0) {
        return Response.json({
          valid: false,
          reason: `Domain "@${domain}" tidak memiliki server penerima email aktif. Gunakan email yang benar-benar ada.`,
        });
      }

      return Response.json({ valid: true, domain });
    } catch (dnsErr: unknown) {
      const code = (dnsErr as { code?: string; message?: string })?.code || '';
      const msg = (dnsErr as { message?: string })?.message || '';

      if (msg === 'DNS_TIMEOUT') {
        // Only allow known verified major providers if local DNS resolver timed out
        const trustedFallback = new Set([
          'gmail.com',
          'googlemail.com',
          'yahoo.com',
          'yahoo.co.id',
          'outlook.com',
          'hotmail.com',
          'live.com',
          'icloud.com',
          'me.com',
          'proton.me',
          'protonmail.com',
          'zoho.com',
        ]);
        if (trustedFallback.has(domain)) {
          return Response.json({ valid: true, domain });
        }
      }

      if (
        code === 'ENOTFOUND' ||
        code === 'ENODATA' ||
        code === 'ESERVFAIL' ||
        code === 'EREFUSED' ||
        msg === 'DNS_TIMEOUT'
      ) {
        return Response.json({
          valid: false,
          reason: `Domain email "@${domain}" tidak ditemukan di internet atau tidak aktif. Pastikan Anda memakai email asli yang benar-benar ada.`,
        });
      }

      return Response.json({
        valid: false,
        reason: `Tidak dapat memverifikasi domain email "@${domain}". Gunakan email aktif seperti Gmail, Yahoo, atau email bisnis resmi.`,
      });
    }
  } catch {
    return Response.json(
      { valid: false, reason: 'Gagal memvalidasi alamat email.' },
      { status: 500 }
    );
  }
}
