const sessionService = require('../modules/session/session.service');

const ERRORS = require('../config/errors');
const { USER } = require('../config/model_constants');

/**
 * Returns a auth middleware
 * @param {Boolean} [root_only] Set to `true` to allow only root here,
 */
module.exports = (root_only = false) => {

    return async (ctx, next) => {

        let token = ctx.headers['Authorization'] || ctx.headers['authorization'] || '';
        token = token.replace('Bearer ', '');

        const [err, result] = await sessionService.verifyToken(token).to();

        if(err) return ReE(ctx, err);

        if(root_only && result.user.role !== USER.ROLE.ROOT) return ReE(ctx, new PermissionError('Insufficient permissions for resource', ERRORS.SUB_CODE.SESSION.ROOT_ONLY));

        ctx.state.session_id = result.session_id;
        ctx.state.user = result.user;

        return next();

    };

};