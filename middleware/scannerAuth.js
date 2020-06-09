const scannerService = require('../modules/scanner/scanner.service');

/**
 * Returns a scanner auth middleware
 */
module.exports = async (ctx, next) => {
    const { imei: scannerImei } = ctx.request.body;

    try {
        await scannerService.verifyImei(scannerImei);
    } catch (e) {
        return ReE(ctx, e);
    }

    return next();
};
