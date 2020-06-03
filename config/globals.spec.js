const { expect } = require('chai');

describe('Global functions testing', () => {

    const MOCK_INVALID_JSON = [
        '{', '123}', '312jh3', '{]', '{ a }', '{ a: 1 }', '{ "nested": { a: 1 } }'
    ];

    const MOCK_VALID_JSON = [
        '{}', '{ "a": 1 }', '[ { "a": 123 }, [ 1, 2, 3 ]  ]', '{ "n": { "b": [ { "a": 1 } ] } }'
    ];


    describe('and the method isJSON shall', () => {

        it('return false for invalid JSON strings', () => {

            MOCK_INVALID_JSON.forEach(i => expect(isJSON(i)).to.be.false);

        });

        it('return true for valid JSON strings', () => {

            MOCK_VALID_JSON.forEach(i => expect(isJSON(i)).to.be.true);

        });

    });

    describe('and the method parseJSON shall', () => {

        it('return the original value if the JSON is not valid', () => {

            MOCK_INVALID_JSON.forEach(i => expect(parseJSON(i)).to.equal(i));

        });

        it('return the parse JSON if the JSON string was valid', () => {

            MOCK_VALID_JSON.forEach(i => expect(parseJSON(i)).to.be.deep.equal(JSON.parse(i)));

        });

    });

});