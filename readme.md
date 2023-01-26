# SSI web API

This is the repository for the web api supporting the Self-sovereign ID project.

## Generating a (root) certificate.

To generate a certificate, you can use the `generate-cert` npm script. This
command can be used to generate self-signed certificates but can also take a
parent to sign a cert. Use `npm run generate-cert -- --help` to view usage.

Example of generating self-signed (root) certificate:

```sh
npm run generate-cert -- -c ./root-certificate.ssi -t "ROOT" -k ./root-key.pem
```

Note the use of `--` after the npm run command. This is in order to pass the
options after it to the generate-cert script, instead of the npm run script.
(basic shell knowledge) (you don't learn this in IntelliJ).

## viewing a certificate

There is also a script to view a certificate. Use

```sh
npm run view-certificate -- help
```

to see it's usage.

## How to run locally

To run this project you need to have [NodeJs](https://nodejs.org/en/) 18.3.0 or
above installed.

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
