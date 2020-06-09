const { JOBS: { TRAFFIC_REPORT }} = require('../config/config');
const scannerTrafficService = require('../modules/scannerTraffic/scannerTraffic.service');

module.exports = {
    schedule: '59 23 * * 0',
    enabled: TRAFFIC_REPORT.ENABLED,
    async handler() {
        const [err, result] = await scannerTrafficService.trafficReport().to();

        if(err) throw err;

        if(result) log.info(`Cleared ${result} expired sessions`);
    }
};
