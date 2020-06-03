const Service = require('../../classes/Service');

const jwt = require('jsonwebtoken');

const Session = require('./session.model');
const User = require('../user/user.model');

const CONFIG = require('../../config/config');
const ERRORS = require('../../config/errors');
const { EVENTS } = require('../../config/static');

const { ObjectId } = require('mongodb');
const { schemas, validateInput } = require('../../utils/validation');

class SessionService extends Service {

    /**
     * Clears sessions
     * @param {Object} filter Session model query.
     * @param {Object} [query_options] Additional query options. 
     * @returns {Number} Returns the number of sessions cleared.
     */
    async clearSessions(filter = {}, query_options = {}) {

        const sessions = await Session.find(filter, '_id user_id', query_options).lean().exec();

        if(!sessions.length) return 0;

        const session_ids = sessions.map(s => s._id);
        await Promise.all([
            Session.deleteMany({ _id: session_ids }).exec(),
            ...session_ids.map(id => this.cache.del(String(id)))
        ]);

        return session_ids.length;

    }

    /**
     * Clears all user sessions.
     * @param {(ObjectId|String)} user_id
     * @param {(objectId|String)} expect_session_id
     */
    async clearUserSessions(user_id, expect_session_id) {
        
        const filter = { user_id };
        if(expect_session_id) filter._id = { $ne: expect_session_id };

        return this.clearSessions(filter);
        
    }

    /**
     * Clears the current session.
     * @param {(ObjectId|String)} session_id Current session id. 
     */
    async clearCurrentSession(session_id) {

        return this.clearSessions({ _id: session_id }, { limit: 1 });

    }

    /**
     * Clears expired sessions.
     */
    async clearExpiredSessions() {

        return this.clearSessions({ expires_at: { $lte: Date.now() } });

    }

    /**
     * Logs in the user and creates the session.
     * @param {String} username Username. 
     * @param {String} password User password.
     */
    async login(username, password) {

        username = validateInput(username, schemas.user.username);
        password = validateInput(password, schemas.user.password);

        const user = await User.findOne({ username }, '+password').exec();
   
        if(!user || !user.checkPassword(password)) throw new ConflictError('Invalid username or password', ERRORS.SUB_CODE.USER.INVALID_USERNAME_PASSWORD);

        const session = await Session.create({ user_id: user._id });

        const token = jwt.sign({ session_id: String(session._id), user_id: String(user._id) }, CONFIG.SESSION.JWT_SECRET);

        return token;

    }

    /**
     * Verifies a token and returns a session object.
     * @param {String} token JWT token. 
     */
    async verifyToken(token) {

        let payload = {};
        try {
            payload = jwt.verify(token, CONFIG.SESSION.JWT_SECRET, { ignoreExpiration: true });
        } catch(e) {
            throw new InputValidationError('Invalid token', ERRORS.SUB_CODE.SESSION.INVALID_TOKEN);
        }

        const cached = this.cache.get(payload.session_id);

        if(cached) return cached;

        const [ session, user ] = await Promise.all([
            Session.findById(payload.session_id).exec(),
            User.findById(payload.user_id).exec()
        ]);

        if(!session || !user || session.expires_at.getTime() <= Date.now()) throw new AuthenticationError('Session expired', ERRORS.SUB_CODE.SESSION.SESSION_EXPIRED);

        return { session_id: String(session._id), user: { _id: String(user._id), username: user.username, role: user.role } };

    }

};

module.exports = new SessionService('Session', { events: EVENTS.SESSION });