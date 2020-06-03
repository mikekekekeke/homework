const fs = require('fs').promises;
const path = require('path');

module.exports = {

    /**
     * Requires/imports certain component types.
     * @private
     * @param {String} extension Component extension, example: `.service.js`.
     */
    async _requireFiles(extension) {

        const components = await fs.readdir(path.join(__dirname, '../modules'));
        const modules = await Promise.all(components.map(async c => {

            const component_files = await fs.readdir(path.join(__dirname, '../modules/', `${c}/`));
            let modules = component_files.filter(f => f.endsWith(extension));

            modules = modules.map(s => require(`../modules/${c}/${s}`));

            return modules;

        }));

        return _.flatten(modules);

    },

    /**
     * Requires all available services to initialize them.
     */
    async touchServices() {
        return this._requireFiles('.service.js');
    },

    /**
     * Finds all route files inside the components folder. Routers are sorted by index if provided.
     */
    async getRoutes() {
        const routes = await this._requireFiles('.route.js');
        return routes.map(r => _.isNumber(r.index) ? r : { router: r, index: 0 }).sort((a, b) => a.index - b.index).map(r => r.router);
    }

};