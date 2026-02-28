// Functions for encryption/decryption
import * as crypto from 'crypto';

const ALGORITHM =  "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const IV_LENGTH = 12;
 
/**
 * Encrypts a object with secretKey (ENCRYPTION_KEY)
 * @param objToEncrypt object to encrypt
 * @param secret secret string
 * @returns Encrypted token
 */
export function encryptObject(objToEncrypt: object): string {
    if(ENCRYPTION_KEY.length !== 32) {
        throw new Error(`Error: invalid ENCRYPTION_KEY length`);
    } 
    
    const jsonString = JSON.stringify(objToEncrypt);
    const iv = crypto.randomBytes(IV_LENGTH);  
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv) as crypto.CipherGCM;

    const encrypted = Buffer.concat([cipher.update(jsonString, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Function to decrypt a string back to an object
 * @param encryptedToken Encrypted data (token)
 * @returns Decrypted object
 */
export function decryptObject(encryptedToken: string): string {
  try {
    const output = Buffer.from(encryptedToken, 'utf8').toString('utf8');
    const [ivHex, authTagHex, encryptedHex] = output.split(':');
    
    if (!ivHex || !encryptedHex || !authTagHex) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex'); 
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error('Decryption failed: Invalid key or tampered data');
  }
}