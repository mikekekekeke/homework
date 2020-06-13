const fs = require('fs').promises;
const path = require('path');
const schedule = require('node-schedule');

require('dotenv').config();
require('../config/globals');
require('../config/prototypes');

const db = require('./database');

const fileUtils = require('../utils/files');

const setupJobRunner = async () => {

    const CONFIG = require('../config/config');
    const { SERVER_MODE } = require('../config/static');
    const ERRORS = require('../config/errors');

    CONFIG.SERVER_MODE = SERVER_MODE.CRON;

    await db.__setup();

    const migrator = require('../jobs/migrator'); //Run migrator first.
    await migrator.handler();

    await fileUtils.touchServices(); //Init services.

    let jobs = await fs.readdir(path.join(__dirname, '../jobs'));
    jobs = jobs.filter(j => j !== 'migrator.js' && !j.endsWith('.spec.js')); //Filter out migrator and test files.

    log.info(`${jobs.length} background jobs found.`);

    const SystemLogService = require('../modules/system_log/system_log.service');

    jobs.forEach(job_file => {
        const job = require(`../jobs/${job_file}`);

        if (job.enabled) {
            log.info(`Scheduling "${_.startCase(job_file.replace('.js', ''))}" to "${job.schedule}"`);

            if (job.schedule === -1) job.handler();
            else schedule.scheduleJob(job.schedule, async () => {

                const job_name = _.startCase(job_file.replace('.js', ''));

                log.info(`Running job "${job_name}"...`);

                try {

                    const start = Date.now();

                    const result = await job.handler();

                    log.info(`Job "${job_name}" finished in ${((Date.now() - start) / 1000).toFixed(2)}s, with: ${JSON.stringify(result)}`);

                } catch (e) {

                    log.danger(`Job "${job_name}" failed... error:`);
                    log.danger(e);
                    SystemLogService.logInternalError(e, ERRORS.SUB_CODE.GENERAL.CRON_JOB).to();

                }

                return true;

            });
        } else log.info(`Job "${_.startCase(job_file.replace('.js', ''))}" not enabled for executing.`);
    });

};

setupJobRunner();
