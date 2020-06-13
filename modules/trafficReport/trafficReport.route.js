const Router = require('koa-router');
const router = new Router({ prefix: '/api/traffic_report/' });

const auth = require('../../middleware/auth');

const trafficReportService = require('./trafficReport.service');

router.get('v1/', auth(), async ctx => {

  const { limit, offset, date, road, trafficNumber } = ctx.query;

  const [err, result] = await trafficReportService.fetchReports(limit, offset, { date, road, trafficNumber }).to();

  return Respond(ctx, err, result);

});

router.get('v1/:report_id', auth(), async ctx => {

  const { report_id } = ctx.params;

  const [err, scanner] = await trafficReportService.fetchReport(report_id).to();

  return Respond(ctx, err, scanner);

});

module.exports = router;
