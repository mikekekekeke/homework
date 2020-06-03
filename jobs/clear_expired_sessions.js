const sessionService = require('../modules/session/session.service');

module.exports = {
    schedule: -1,
    async handler() {

        const [err, result] = await sessionService.clearExpiredSessions().to();

        if(err) throw err;

        if(result) log.info(`Cleared ${result} expired sessions`);

    }
};