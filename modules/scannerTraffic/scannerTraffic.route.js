const Router = require('koa-router');
const router = new Router({ prefix: '/api' });

const scannerAuth = require('../../middleware/scannerAuth');

const scannerTrafficService = require('./scannerTraffic.service');

router.post('/traffic_scan', scannerAuth, async ctx => {
    const { imei, scans } = ctx.request.body;
    const { scanner: { status: scannerStatus } } = ctx.state;

    const [err, result] = await scannerTrafficService.saveScans(imei, scans, scannerStatus).to();

    return Respond(ctx, err, result);
});

module.exports = router;
