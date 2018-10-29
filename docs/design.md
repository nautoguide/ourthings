# Coding Standards

All code should be targeted at ES6. This include both node & browser code

ES6 additions can be found here:

https://www.w3schools.com/js/js_es6.asp

See build process for details on targeting non ES6 platforms

We mandate style guide for all submissions

https://github.com/rwaldron/idiomatic.js/

# Environment

Before stanting you will need the following packages installed:

## node & npm

Install node & npm as per your platform guides

https://nodejs.org/en/download/

Install our base packages

```npm install```

## Webpack

```npm install -g webpack```

On windows additionally the webpack-cli

```npm install -g webpack-cli```

## JSDoc

Still working this

# Build

Build latest 

```npm run build```

Update the API Docs

```npm run apidoc```

# Testing

To run the tests you will need to start a local http-server

```
npm install -g http-server
http-server
```

Then you can start testing using

```
npm test #With chrome window
npm headlesstest #In headless mode
```
 

Note you need to run a build to test any changes