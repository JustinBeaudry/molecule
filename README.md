Molecule
========

A CLI tool for backing up and restoring Atom Packages.

## Install and Setup

```
npm i -g atom-molecule
npm link
```

## Usage

backup packages to manifest.json

```
mlcl -b
```
add these files to your dotfiles gitignore

```
.atom/compile-cache
.atom/packages
.atom/storage
```

commit your .atom folder to your dotfiles

when installing atom on a new system just run

```
mlcl -r
```

## Options

```
--backup, -b, backup atom packages to ~/.atom/manifest.json, by default backup will ignore disabledPackages
[-d] forces molecule to backup disabledPackages

--restore, -r restores packages from ~/.atom/manifest.json
[--silence, -s] silence install output from apm

--help, -h, ?, output help
```

## TODO

* install package dependencies ? (does apm do this already?)
* respect package versions described in package.json (use npm)
* fallback to git if apm not installed?
* skip installed packages on restore

## ROADMAP

* 0.1.0 - Initial Release
