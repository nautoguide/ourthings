let shell = require('shelljs');

shell.rm(['src/ourthings/package.json']);
shell.rm('-rf','node_modules');