/**
 * Módulo Funcional de Geração de Pix Copia e Cola (Padrão Oficial Banco Central / BR Code EMV)
 * Gera payload determinístico com valor exato embutido e cálculo de CRC16.
 */

export interface PixOptions {
  pixKey: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string;
  merchantCity: string;
  amount?: number;
  txid?: string;
  description?: string;
}

/**
 * Função utilitária: formata campo EMV TLV (Tag - Length - Value)
 */
function formatEMVField(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Normaliza o nome do comerciante (máx 25 chars, sem acentos para conformidade EMV)
 */
function sanitizeString(str: string, maxLen = 25): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .substring(0, maxLen)
    .toUpperCase();
}

/**
 * Normaliza chave Pix de acordo com o tipo
 */
function normalizePixKey(key: string, type?: string): string {
  const cleanKey = key.trim();
  if (type === 'phone' || (!type && /^\+?[0-9]{10,13}$/.test(cleanKey))) {
    const digits = cleanKey.replace(/\D/g, '');
    if (digits.startsWith('55')) {
      return `+${digits}`;
    }
    return `+55${digits}`;
  }
  if (type === 'cpf' || type === 'cnpj') {
    return cleanKey.replace(/\D/g, '');
  }
  return cleanKey;
}

/**
 * Cálculo do Checksum CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Função Pura: Gera o código Pix Copia e Cola Oficial com o valor exato
 */
export function generatePixPayload(options: PixOptions): string {
  const key = normalizePixKey(options.pixKey, options.pixKeyType);
  const name = sanitizeString(options.merchantName || 'LUCCA CELL', 25);
  const city = sanitizeString(options.merchantCity || 'GUAJARA', 15);
  const txid = sanitizeString(options.txid || '***', 25);

  // 1. Informações da Conta do Comerciante (ID 26 - br.gov.bcb.pix)
  const gui = formatEMVField('00', 'br.gov.bcb.pix');
  const pixKeyField = formatEMVField('01', key);
  const descField = options.description
    ? formatEMVField('02', sanitizeString(options.description, 40))
    : '';
  const merchantAccountInfo = formatEMVField('26', `${gui}${pixKeyField}${descField}`);

  // 2. Montagem dos blocos obrigatórios
  let payload =
    formatEMVField('00', '01') + // Payload Format Indicator
    merchantAccountInfo + // Merchant Account Information (Pix)
    formatEMVField('52', '0000') + // Merchant Category Code (0000 = Geral)
    formatEMVField('53', '986'); // Transaction Currency (986 = BRL)

  // 3. Valor da Transação (ID 54) - opcional se for Pix sem valor fixo
  if (options.amount && options.amount > 0) {
    const formattedAmount = options.amount.toFixed(2);
    payload += formatEMVField('54', formattedAmount);
  }

  // 4. País e Comerciante
  payload +=
    formatEMVField('58', 'BR') + // Country Code
    formatEMVField('59', name) + // Merchant Name
    formatEMVField('60', city); // Merchant City

  // 5. Informações Adicionais / TXID (ID 62)
  const txidField = formatEMVField('05', txid);
  payload += formatEMVField('62', txidField);

  // 6. CRC16 Checksum (ID 63)
  const payloadToCalculate = `${payload}6304`;
  const crc = calculateCRC16(payloadToCalculate);

  return `${payloadToCalculate}${crc}`;
}

/**
 * Função Pura: Gera a URL do QR Code Dinâmico
 */
export function generatePixQrCodeUrl(payload: string, size = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}&color=000000&bgcolor=ffffff&margin=1`;
}
