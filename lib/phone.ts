const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function normalizePhoneNumber(input: string | null | undefined): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasPlusPrefix = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  if (!digits) return null;

  if (hasPlusPrefix) {
    const normalized = `+${digits}`;
    return E164_REGEX.test(normalized) ? normalized : null;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export function normalizeWhatsAppAddress(input: string | null | undefined): string | null {
  if (!input) return null;

  const withoutPrefix = input.startsWith('whatsapp:')
    ? input.slice('whatsapp:'.length)
    : input;

  const normalizedPhone = normalizePhoneNumber(withoutPrefix);
  return normalizedPhone ? `whatsapp:${normalizedPhone}` : null;
}

export function phoneNumbersMatch(left: string | null | undefined, right: string | null | undefined): boolean {
  const normalizedLeft = normalizePhoneNumber(left);
  const normalizedRight = normalizePhoneNumber(right);

  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}
