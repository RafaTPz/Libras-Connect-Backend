import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e';
const key = Buffer.from(ENCRYPTION_KEY, 'hex');

if (key.length !== 32) {
  throw new Error('Chave de criptografia inválida. Deve ter exatamente 32 bytes (64 caracteres hex).');
}

// IV determinístico fixo de 16 bytes para buscas por e-mail no banco
const DETERMINISTIC_IV = Buffer.from('deaf_accessibility_connect_iv_20', 'utf8').slice(0, 16);

// 1. Criptografia Determinística (para E-mail - permite buscas indexadas)
export function encryptDeterministic(text) {
  if (!text) return text;
  const cipher = crypto.createCipheriv('aes-256-cbc', key, DETERMINISTIC_IV);
  let encrypted = cipher.update(text.toLowerCase().trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptDeterministic(ciphertext) {
  if (!ciphertext) return ciphertext;
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, DETERMINISTIC_IV);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Falha ao descriptografar dado determinístico:', error.message);
    return ciphertext; // Retorna original em caso de erro para evitar quebra silenciosa
  }
}

// 2. Criptografia Não-Determinística (para Nome - IV aleatório por gravação)
export function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text.trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // Se não contiver caractere divisor, assume-se que é dado não criptografado/legado
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Falha ao descriptografar dado não-determinístico:', error.message);
    return encryptedText;
  }
}
