#  Car tracker

## Running the project.

Run `npm install` to install all dependencies.

You need to run `MongoDB 4.*`, either as a single database or a replica set.

Run the app suing `npm start` or `npm run start:dev`.

Run tests using `npm test`. You can specify which test to run by adding the test description as the second parameter:

```
npm test 'and the method addScanner shall'
```

## Environmental variables.

You need to create a `.env` file in the root folder. You can use the `example.env` for a quick start.

## API URL stricture

Urls structure is like this:

`server-url.com/api/{module}/{version}/{ending}`

Example:

`server-url.com/api/scanner/v1/scanner_1_id`

## Events

This project uses event emitters, to emit certain events that can registered in the `Service` class options.
`Scanner` service has an example usage.