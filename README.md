Molecule
========

![Molecule](https://github.com/JustinBeaudry/molecule/blob/master/molecule.png)

A CLI tool for backing up and restoring Atom Packages.

## Options

```
-b backup atom packages to ~/.atom/manifest.json, by default backup will ignore disabledPackages
[-d] forces molecule to backup disabledPackages

-r restores packages from ~/.atom/manifest.json
[-d] silence install output from apm

-h output help
--help
```

## TODO

* install pacakge dependencies ? (does apm do this already?)
* respect package versions described in package.json
* fallback to git if apm not installed?
* skip installed packages on restore

## ROADMAP

* 0.1.0 - Initial Release

Logo created by [David Chapman](https://thenounproject.com/david.chapman) from the [The Noun Project](thenounproject.com/)
