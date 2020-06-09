const scannerTrafficService = require('../modules/scannerTraffic/scannerTraffic.service');

/**
 * Returns a scanner auth middleware
 */
module.exports = async (ctx, next) => {
    const { imei: scannerImei } = ctx.request.body;

    try {
        await scannerTrafficService.verifyImei(scannerImei);
    } catch (e) {
        return ReE(ctx, e);
    }

    return next();
};
