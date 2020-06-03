Promise.prototype.to = function (default_result) {
    return this.then(result => {
        return [null, result];
    }).catch(error => {
        return [error, default_result || null];
    });
};

Array.prototype.any = function () {
    if (!this.length) return null;
    return this[_.random(0, this.length - 1, false)];
};

Array.prototype.last = function () {
    if (!this.length) return null;
    return this[this.length - 1];
};

Array.prototype.depth = function () {
    return 1 + (this instanceof Array ? this.reduce(function (max, item) {
        return Math.max(max, test(item));
    }, 0) : -1);
}

String.prototype.replaceAll = function (search, replacement) {
    return this.split(search).join(replacement);
}

String.prototype.extract = function (template) {

    const regex = /[^<]+(?=>)/g;
    let matches = [];

    let match;
    while ((match = regex.exec(template)) !== null) {
        matches.push(match[0]);
    }

    matches.forEach(match => template = template.replace(`<${match}>`, '(.+)'));

    template = new RegExp(template);

    const values = template.exec(this);

    if (!values) return null;

    const result = {};

    matches.forEach((match, index) => result[match] = values[index + 1]);

    return result;
}

module.exports = {};