const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer to upload.
 * @param {string} filename - The original filename (for extension detection).
 * @param {string} folder - Cloudinary folder (default: 'gxnova_certificados').
 * @returns {Promise<string>} - The secure URL of the uploaded file.
 */
async function uploadBuffer(buffer, filename, folder = 'gxnova_certificados') {
    return new Promise((resolve, reject) => {
        // Determine resource type based on extension
        const ext = filename.split('.').pop().toLowerCase();
        const resourceType = ['pdf'].includes(ext) ? 'raw' : 'image';

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                public_id: `cert_${Date.now()}`,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

module.exports = { uploadBuffer };
