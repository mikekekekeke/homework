const scannerService = require('../modules/scanner/scanner.service');

/**
 * Returns a scanner auth middleware
 */
module.exports = async (ctx, next) => {
    const { imei: scannerImei } = ctx.request.body;

    const [err, result] = await scannerService.verifyImei(scannerImei).to();

    if(err) return ReE(ctx, err);

    ctx.state.scanner = result.scanner;

    return next();
};
