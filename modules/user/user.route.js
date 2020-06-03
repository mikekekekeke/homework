const Router = require('koa-router');
const router = new Router({ prefix: '/api/users/' });

const auth = require('../../middleware/auth');

const userService = require('./user.service');

router.get('v1/', auth(true), async ctx => {

    const { limit, offset } = ctx.query;

    const [err, result] = await userService.fetchUsers(limit, offset).to();

    return Respond(ctx, err, result);

});

router.post('v1/', auth(true), async ctx => {

    const { username, password } = ctx.request.body;

    const [err, user] = await userService.addUser(username, password).to();

    return Respond(ctx, err, { username: user.username });

});

router.put('v1/password', auth(), async ctx => {

    const { old_password, new_password } = ctx.request.body;
    const user_id = _.get(ctx.state, 'user._id');

    const [err, result] = await userService.changePassword(user_id, old_password, new_password).to();

    return Respond(ctx, err, { result });

});

router.del('v1/:user_id', auth(true), async ctx => {

    const user_id = ctx.params;
    const remover_id = _.get(ctx.state, 'user._id');

    const [err, result] = await userService.removeUser(user_id, remover_id).to()

    return Respond(ctx, err, { result });

});

module.exports = router;