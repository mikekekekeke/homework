const fs = require('fs').promises;
const path = require('path');

const Migration = require('../modules/misc/migration.model');

module.exports = {
    schedule: -1,
    enabled: true,
    async handler() {

        let [ migration_files, migrations_ran ] = await Promise.all([
            fs.readdir(path.join(__dirname, '../migrations')),
            Migration.find({}, null, { lean: true }).exec()
        ]);

        migration_files = migration_files.sort();
        migrations_ran = migrations_ran.map(m => m.name);

        const new_migrations = _.difference(migration_files, migrations_ran);
        if (new_migrations.length === 0) {
            log.info(`Migrations not found. Last migration name: ${migration_files[migration_files.length - 1].replace('.js', '')}`);
        } else {
            let migration_count = 0;

            for (let migration of new_migrations) {
                await require(`../migrations/${migration}`).up();
                await Migration.create({name: migration});
                migration_count++;
            }

            log.info(`Migrations completed. Changes count: ${migration_count}`);
        }
    }
};
