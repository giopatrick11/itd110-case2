const QRCode = require('qrcode');

/**
 * Generate QR code for an incident
 */
const generateIncidentQRCode = async (incidentId) => {
    // We'll use localhost:5000 as the base URL since that's what's in .env
    const port = process.env.PORT || 5000;
    const url = `http://localhost:${port}/#incident=${incidentId}`;
    
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(url);
        return {
            incidentId,
            qrCode: qrCodeDataUrl,
            url
        };
    } catch (err) {
        console.error('QR Code generation error:', err);
        throw new Error('Failed to generate QR code');
    }
};

module.exports = {
    generateIncidentQRCode
};
