#! /usr/bin/env node
'use strict';

var chalk        = require('chalk');
var fs           = require('graceful-fs');
var vfs          = require('vinyl-fs');
var path         = require('path');
var os           = require('os');
var osenv        = require('osenv');
var CSON         = require('season');
var map          = require('vinyl-map');
var util         = require('util');
var stringify    = require('json-stringify-safe');
var sh           = require('shelljs');
var ProgressBar  = require('progress');

var manifestName = 'manifest.json';
var atomPath     = path.resolve(osenv.home(), '.atom');
var argv         = require('minimist')(process.argv.slice(2));


//====
// check for apm
//====
if (!sh.which('apm')) {
  process.stderr.write(chalk.bold.red('[Molecule Fatal Error]', 'APM is required to be installed to use Molecule.' + os.EOL));
  process.exit(1);
}
//====
//  Parse Command Line Arguments
//====
if (argv.b)
{
  checkAtomDirectory();
  backup();
}
else if (argv.r)
{
  checkAtomDirectory();
  checkAtomPackagesManifest();
  restore();
}
else if (argv.h || argv.help)
{
  help();
}
else
{
  help();
}

//====
// CLI Commands
//====
function backup(disabled) {

  var disabled = null;
  var config;
  // forces the backup of disabled dependencies, defaults to skipping
  if (!argv.d) {
    config = CSON.readFileSync(path.join(atomPath, 'config.cson'));

    if (config && config['*'] && config['*'].core && config['*'].core.disabledPackages) {
      disabled = config['*'].core.disabledPackages;
      process.stdout.write(chalk.yellow('[Molecule] skipping disabled packages' + os.EOL + stringify(disabled, null, 2) + os.EOL));
    }
  }

  process.stdout.write(chalk.bold.green('[Molecule] Backing up atom packages to', atomPath + '/' + manifestName + os.EOL));

  var manifest = [];

  vfs.src('packages/*/package.json', {
    cwd: atomPath
  })
  .pipe(map(function(file, filename) {

    // file is a Buffer
    file = file.toString();
    var pkg;

    try {
      file = JSON.parse(file);
    } catch (e) {
      errors(e);
      process.stderr.write(file + chalk.bold.red('failed JSON parsing at filename: ') + filename + os.EOL);
      process.exit(1);
    }

    if (file.name && file.version) {
      pkg = {
        name: file.name,
        version: file.version,
        repo: (file.repository || null)
      };
    }
    if (!disabled || (util.isArray(disabled) && disabled.indexOf(pkg.name) < 0)) {
      manifest.push(pkg);
    }
  }))
  .on('end', function() {
    try {
      manifest = stringify(manifest, null, 2) + os.EOL;
    } catch(e) {
      errors(e);
      process.exit(1);
    }
    fs.writeFileSync(path.join(atomPath, manifestName), manifest);
    process.stdout.write(chalk.bold.green('[Molecule] Backup Complete!' + os.EOL));
  });

}

function restore() {
  var pkgs;

  var completed = 0;
  var errored = 0;
  var bar;

  process.stdout.write(chalk.bold.green('[Molecule] Restoring atom packages from', manifestName, 'at', atomPath + os.EOL));

  var manifest = fs.readFileSync(path.join(atomPath, manifestName));

  manifest = manifest.toString();

  try {
    manifest = JSON.parse(manifest);
  } catch(e) {
    errors(e);
    process.exit(1);
  }

  if (!util.isArray(manifest)) {
    errors('package restore expects manifest to be an array. exiting...');
    process.exit(1);
  }

  bar = new ProgressBar(
    chalk.bold.yellow('  [:bar] :completed/:total') +
    chalk.bold.red(' :errored error(s)')+
    (argv.s ? '\r' : os.EOL),
    {
      total: manifest.length,
      callback: function restoreComplete() {
        var hasErrors = errored > 0;
        var completeText = '[Molecule] Restore Complete!';
        process.stdout.write(
          chalk.bold.green('[Molecule] Restored ' + completed + '/' + manifest.length + ' packages. ') +
          chalk.bold.red(errored + ' package') + (errored > 1 ? chalk.bold.red('s') : '') + chalk.bold.red(' failed.') + os.EOL +
          (hasErrors ? chalk.bold.yellow(completeText) : chalk.bold.green(completeText)) + os.EOL
        );
      }
    }
  );

  process.stdout.write(os.EOL + chalk.bold.white('  ' + manifest.length + ' packages to install' + os.EOL + os.EOL));

  manifest.forEach(function(pkg) {
    // @TODO allow specification of package version
    if (!pkg || !pkg.name) {
      errors('package is malformed. skipping package.');
      return false;
    }

    if (sh.exec('apm install ' + pkg.name, {silent: argv.s}).code !== 0) {
      errors('apm failed with a nonzero status code');
      errored++;
    } else {
      completed++;
    }

    bar.tick({
      errored: errored,
      completed: completed,
      total: manifest.length
    });
  });
}

function help() {
  var eol = os.EOL;
  process.stdout.write(
    [
      chalk.bold.green('Molecule'),
      chalk.green('\tsimple CLI for dotfiles management of apm packages in Githubs\' Atom Editor'),
      chalk.gray('\thttps://github.com/atom/atom'),
      '[options]',
      chalk.bold.green('\t-b') + chalk.green(', backup atom packages to ' + atomPath + '/' + manifestName),
      chalk.bold.green('\t[-d]') + chalk.green(', backup disabled packages'),
      eol,
      chalk.bold.green('\t-r') + chalk.green(', restore atom packages from ' + atomPath + '/' + manifestName),
      chalk.bold.green('\t[-s]') + chalk.green(', silent install output from apm'),
      eol,
      chalk.bold.green('\t-h') + chalk.green(', output help'),
      chalk.bold.green('\t--help'),
      eol
    ].join(eol)
  );
  process.exit(0);
}

//======
// Check Atom Editor Requirements
//======

function checkAtomDirectory() {
  var stats = fs.statSync(atomPath)
  if (!stats.isDirectory()) {
    errors('.atom directory not found at ' + atomPath);
    process.exit(1);
  }
}

function checkAtomPackagesManifest() {
  var stats = fs.statSync(path.join(atomPath, manifestName));
  if (!stats.isFile()) {
    errors(manifestName, 'not found at', atomPath);
    process.exit(1);
  }
}

function errors(err) {
  process.stderr.write(chalk.bold.red('[Molecule Error]', err + os.EOL));
}
