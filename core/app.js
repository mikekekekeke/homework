'use strict'

async function initApp() {

    //Do imports inside function here to avoid unnecessary imports in the master process.
    const Koa = require('koa');
    const path = require('path');

    //middleware and koa components.
    const bodyParser = require('koa-json-body');
    const serve = require('koa-static');
    const mount = require('koa-mount');
    const logger = require('koa-logger');

    require('dotenv').config();
    require('../config/globals');
    require('../config/prototypes');

    const { NODE_ENV } = require('../config/static');
    const CONFIG = require('../config/config');

    const db = require('./database');

    const fileUtils = require('../utils/files');

    const app = new Koa();

    await db.__setup(); //Start database.

    if(CONFIG.NODE_ENV === NODE_ENV.DEVELOPMENT) {
        app.use(logger());
    }
    app.use(mount('/static', serve(path.join(__dirname + '../static')))); //Serve static files.
    app.use(bodyParser({ limit: '100kb', fallback: true }));

    await fileUtils.touchServices(); //Even tough most services will be accessed via routes, some maybe require to be touched to go online.

    const routers = await fileUtils.getRoutes(); //Get all available routers.

    routers.forEach(router => app.use(router.routes()));

    app.listen(CONFIG.PORT, () => {
        log.info(`HTTP Server listening on: ${CONFIG.PORT}`);
    });

    return app;

}

module.exports = initApp();