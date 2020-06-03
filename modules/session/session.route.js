const Router = require('koa-router');
const router = new Router({ prefix: '/api/session/' });

const auth = require('../../middleware/auth');

const sessionService = require('./session.service');

router.post('v1/login', async ctx => {

    const { username, password } = ctx.request.body;

    const [err, token] = await sessionService.login(username, password).to();

    return Respond(ctx, err, { token });

});

router.del('v1/logout', auth(), async ctx => {

    const session_id = _.get(ctx.state, 'session_id');

    const [err] = await sessionService.clearCurrentSession(session_id);

    return Respond(ctx, err);

});

module.exports = router;