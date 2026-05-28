export const fiscalDocumentTypeHelp: Record<string, { title: string; description: string }> = {
  B01: {
    title: 'Credito fiscal',
    description: 'Usa este tipo cuando el cliente necesita comprobante fiscal para crédito de ITBIS.',
  },
  B02: {
    title: 'Consumo',
    description: 'Usa este tipo para ventas normales al consumidor final.',
  },
  B14: {
    title: 'Regimen especial',
    description: 'Usa este tipo para clientes o transacciones bajo regimen especial.',
  },
  B15: {
    title: 'Gubernamental',
    description: 'Usa este tipo para facturación a entidades gubernamentales.',
  },
};

export function normalizeTaxId(value: string) {
  return value.replace(/\D/g, '');
}

export function isValidDominicanRnc(value: string) {
  const rnc = normalizeTaxId(value);
  if (!/^\d{9}$/.test(rnc)) return false;

  const weights = [7, 9, 8, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, weight, index) => acc + Number(rnc[index]) * weight, 0);
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 2 : remainder === 1 ? 1 : 11 - remainder;

  return checkDigit === Number(rnc[8]);
}

export function isValidDominicanCedula(value: string) {
  const cedula = normalizeTaxId(value);
  if (!/^\d{11}$/.test(cedula)) return false;

  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  const sum = weights.reduce((acc, weight, index) => {
    const product = Number(cedula[index]) * weight;
    return acc + (product > 9 ? product - 9 : product);
  }, 0);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === Number(cedula[10]);
}

export function validateDominicanTaxId(value: string) {
  const normalized = normalizeTaxId(value);
  if (!normalized) return { valid: true, normalized, type: null as string | null };
  if (normalized.length === 9) {
    return { valid: isValidDominicanRnc(normalized), normalized, type: 'RNC' };
  }
  if (normalized.length === 11) {
    return { valid: isValidDominicanCedula(normalized), normalized, type: 'Cedula' };
  }
  return { valid: false, normalized, type: null as string | null };
}
