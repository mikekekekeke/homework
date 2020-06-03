const Service = require('../../classes/Service');

const User = require('./user.model');

const ERRORS = require('../../config/errors');
const { EVENTS } = require('../../config/static');
const { USER } = require('../../config/model_constants');

const { ObjectId } = require('mongodb');
const { schemas, validateInput } = require('../../utils/validation');

class UserService extends Service {

    /**
     * Adds a new user.
     * @param {String} username Username of user. 
     * @param {String} password Password of user.
     */
    async addUser(username, password, role = USER.ROLE.USER) {

        username = validateInput(username, schemas.user.username);
        password = validateInput(password, schemas.user.password);

        const duplicate = await User.findOne({ username: username }).lean().exec();

        if(duplicate) throw new DuplicateError(`Username "${username}" already exists`, ERRORS.SUB_CODE.USER.DUPLICATE);

        return User.create({ username, password, role });

    }

    /**
     * Creates a new root user if one does not exist yet.
     * @param {String} username Root username. 
     * @param {String} password Root password.
     */
    async addRootUser(username, password) {

        const root = await User.findOne({ role: USER.ROLE.ROOT }).lean().exec();

        if(root) return false;

        return this.addUser(username, password, USER.ROLE.ROOT);

    }

    /**
     * Removes a user.
     * @param {(ObjectId|String)} user_id User id to delete.
     * @param {(ObjectId|String)} remover_id User id who is deleting. 
     */
    async removeUser(user_id, remover_id) {

        user_id = validateInput(user_id, schemas.objectId);

        const user = await User.findById(user_id).exec();

        if(!user) throw new NotFoundError(`User(${user_id})`, ERRORS.SUB_CODE.USER.NOT_FOUND);

        if(String(remover_id) === String(user._id)) throw new ConflictError('Cannot remove yourself', ERRORS.SUB_CODE.USER.REMOVE_YOURSELF);

        if(user.role === USER.ROLE.ROOT) throw new ConflictError('Cannot remove root', ERRORS.SUB_CODE.USER.REMOVE_ROOT);

        await user.remove();

        this.emitter.dispatch(EVENTS.SESSION.CLEAR_USER_SESSIONS, user._id);

        return true;

    }

    /**
     * Change user password.
     * @param {(ObjectId|String)} user_id User id.
     * @param {String} old_password Current password. 
     * @param {String} new_password Password to replace with. 
     * @param {9ObjectId|String} session_id Current session id.
     */
    async changePassword(user_id, old_password, new_password, session_id) {

        old_password = validateInput(old_password, schemas.string, 'Previous password must be a proper string');
        new_password = validateInput(new_password, schemas.user.password);

        const user = await User.findById(user_id, '+password').exec();

        if(!user) throw new NotFoundError(`User(${user_id})`, ERRORS.SUB_CODE.USER.NOT_FOUND);

        if(!user.checkPassword(old_password)) throw new ConflictError(`Password does not match`, ERRORS.SUB_CODE.USER.INVALID_OLD_PASSWORD);
        
        user.password = new_password;
        
        await user.save();

        this.emitter.dispatch(EVENTS.SESSION.CLEAR_USER_SESSIONS, user._id, session_id);

        return true;

    }

    /**
     * Fetches a list of users.
     * @param {Number} limit Record limit.
     * @param {Number} offset Record offset. 
     */
    async fetchUsers(limit = 100, offset = 0) {

        limit = validateInput(limit, schemas.limit);
        offset = validateInput(offset, schemas.offset);

        const result = await User.aggregate([{
            $match: {
                role: { $ne: USER.ROLE.ROOT }
            }
        }, {
            $project: {
                _id: 1,
                username: 1
            }
        }, {
            $facet: {
                users: [{
                    $skip: offset
                }, {
                    $limit: limit
                }],
                count: [{
                    $count: 'count'
                }]
            }
        }]).exec();

        return { users: _.get(result, '[0].users', []), count: _.get(result, '[0].count[0].count', 0) };

    }

};

module.exports = new UserService('User');