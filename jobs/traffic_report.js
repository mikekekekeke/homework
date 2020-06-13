const { JOBS: { TRAFFIC_REPORT }} = require('../config/config');
const trafficReportService = require('../modules/trafficReport/trafficReport.service');

module.exports = {
    schedule: '59 23 * * 0',
    enabled: TRAFFIC_REPORT.ENABLED,
    async handler() {
        const [err, result] = await trafficReportService.generateReport().to();

        if(err) throw err;

        if(result) log.info(`Weekly report generated.`);
    }
};
