import CryptoJS from 'crypto-js';

const STORAGE_KEY = "@ssi_wallet_data";

export const encryptData = (data, password) => {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
    return encrypted;
};

export const decryptData = (ciphertext, password) => {
    try {
        const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, password);
        const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) return null;
        return JSON.parse(decryptedString);
    } catch {
        return null;
    }
};

export const loadVault = (password) => {
    const raw = localStorage.getItem(STORAGE_KEY);
    // If no vault, return default structure
    if (!raw) return { did: null, keypair: null, credentials: [] };
    
    const vault = decryptData(raw, password);
    return vault;
};

export const saveVault = (vault, password) => {
    const encrypted = encryptData(vault, password);
    localStorage.setItem(STORAGE_KEY, encrypted);
};

export const hasVault = () => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};
