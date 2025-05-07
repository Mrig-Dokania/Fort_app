const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const SECURITY_KEY = process.env.SECURITY_KEY

// AES Encryption and Decryption
// This class provides methods to encrypt and decrypt text using the AES-256-CBC algorithm
const encrypt = (text) => {
    const iv = crypto.randomBytes(16).toString('hex')
    const cipher = crypto.createCipheriv('aes-256-cbc', SECURITY_KEY, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv}:${encrypted}`
}

const decrypt = (encryptedData) => {
    const [iv, encryptedText] = encryptedData.split(':')
    const decipher = crypto.createDecipheriv('aes-256-cbc', SECURITY_KEY, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

// Password Hashing with PBKDF2
const hashPassword = (password) => {
    const salt = crypto.randomBytes(32).toString('hex')
    const iterations = 10000
    const keylen = 64
    const digest = 'sha512'
    
    const hash = crypto.pbkdf2Sync(
        password,
        salt,
        iterations,
        keylen,
        digest
    ).toString('hex')
    
    return `${salt}:${iterations}:${keylen}:${digest}:${hash}`
}

const validatePassword = (password, storedHash) => {
    const [salt, iterations, keylen, digest, originalHash] = storedHash.split(':')
    
    const newHash = crypto.pbkdf2Sync(
        password,
        salt,
        parseInt(iterations, 10),
        parseInt(keylen, 10),
        digest
    ).toString('hex')

    return crypto.timingSafeEqual(
        Buffer.from(newHash),
        Buffer.from(originalHash)
    )
}

// JWT Functions
const GenerateJWT = (data, duration) => {
    return jwt.sign(data, process.env.JWT_SECRET, { 
        expiresIn: duration,
        algorithm: 'HS256'
    })
}

const ValidateJWT = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    } catch (error) {
        return false
    }
}

module.exports = {
    encrypt,
    decrypt,
    hashPassword,
    validatePassword,
    GenerateJWT,
    ValidateJWT
}
