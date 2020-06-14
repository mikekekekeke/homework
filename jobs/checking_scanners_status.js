const { JOBS: { CHECKING_SCANNERS_STATUS }} = require('../config/config');
const scannerService = require('../modules/scanner/scanner.service');

module.exports = {
    schedule: CHECKING_SCANNERS_STATUS.SCHEDULE,
    enabled: CHECKING_SCANNERS_STATUS.ENABLED,
    async handler() {
        const [err, result] = await scannerService.checkStatuses().to();

        if(err) throw err;

        log.info(`Scanners statuses are checked. Scanners checked: ${result.scannersChecked}.`
        + ` Scanners out_of_order after check: ${result.scannersOutOfOrder}`);
    }
};
