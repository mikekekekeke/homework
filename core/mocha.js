const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

const walkSync = (dir, filter = (path) => true, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {

        filelist = fs.statSync(path.join(dir, file)).isDirectory() ?
            walkSync(path.join(dir, file), filter, filelist) :
            (
                filter(file) ?
                    filelist.concat(path.join(dir, file)) :
                    filelist
            );

    });
    return filelist;
};

const runTests = async () => {

    const server = await require('../core/app');
    //server.listen(process.env.PORT || 3000)

    const migrator = require('../jobs/migrator'); //Require after the models have loaded
    await migrator.handler(); //run migrations on test database


    const timeout = process.env.MOCHA_TIMEOUT ? parseInt(process.env.MOCHA_TIMEOUT) : 240000;

    const mocha = new Mocha({
        timeout: timeout
    });

    const filter = file => file.endsWith('.spec.js');
    let mocha_test_files = _.flatten([
        walkSync(path.join(__dirname, '../modules'), filter, []),
        walkSync(path.join(__dirname, '../jobs'), filter, []),
        walkSync(path.join(__dirname, '../utils'), filter, []),
        walkSync(path.join(__dirname, '../classes'), filter, []),
        walkSync(path.join(__dirname, '../config'), filter, []),
        walkSync(path.join(__dirname, '../middleware'), filter, []),
    ]);

    mocha_test_files.forEach(file => mocha.addFile(file));
    mocha.timeout(timeout);

    const grep = process.argv[2];

    if (grep) mocha.grep(grep);

    mocha.run(fail_count => {
        if (fail_count > 0) return process.exit(1);
        return process.exit(0);
    });
}

runTests();

