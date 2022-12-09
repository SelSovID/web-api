# SSI web API

This is the repository for the web api supporting the Self-sovereign ID project.

## How to run locally

To run this project you need to have [NodeJs](https://nodejs.org/en/) installed.

Clone the repository to a local folder. Then cd into it and run

```
$ npm install
```

This will install all the dependencies needed for the project to run to a local
folder.

After this you need to make a copy of the `.env.template` file and fill in the
environment variables. Name this file `.env`.

When you have done all this you can run the program with

```
$ npm start
```

You should now have a running server. Depending on the log level you chose in
`.env` you will see output.

## Testing

A test user with the password `testpassword` can be created by running

```
$ npm run orm seeder:run
```

This command will run the seeder and seed the database with dummy data.
