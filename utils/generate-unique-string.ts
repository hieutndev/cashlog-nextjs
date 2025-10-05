import crypto from 'crypto';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const generateUniqueStringServer = (length = 10): string => {
    if (length <= 0) return '';

    // Use crypto for secure randomness on the server
    const result: string[] = [];
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        // Map byte to an index in the charset
        const idx = randomBytes[i] % CHARSET.length;

        result.push(CHARSET[idx]);
    }

    return result.join('');
};
