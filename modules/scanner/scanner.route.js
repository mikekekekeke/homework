const Router = require('koa-router');
const router = new Router({ prefix: '/api/scanner/' });

const auth = require('../../middleware/auth');

const scannerService = require('./scanner.service');

router.get('v1/', auth(), async ctx => {

    const { limit, offset, city, road } = ctx.query;

    const [err, result] = await scannerService.fetchScanners(limit, offset, { city, road }).to();

    return Respond(ctx, err, result);

});

router.get('v1/:scanner_id', auth(), async ctx => {

    const { scanner_id } = ctx.params;

    const [err, scanner] = await scannerService.fetchScanner(scanner_id).to();

    return Respond(ctx, err, scanner);

});

router.post('v1/', auth(), async ctx => {

    const { name, imei, city, road, coordinates, status } = ctx.request.body;

    const [err, scanner] = await scannerService.addScanner(name, imei, city, road, coordinates, status).to();

    return Respond(ctx, err, scanner);

});

router.put('v1/:scanner_id', auth(), async ctx => {

    const { scanner_id } = ctx.params;
    const { name, imei } = ctx.request.body;

    const [err, scanner] = await scannerService.editScanner(scanner_id, name, imei).to();

    return Respond(ctx, err, scanner);

});

module.exports = router;
