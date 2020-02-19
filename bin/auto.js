#!/usr/bin/env node
const clis = require('../src/cli.js');
let cli = new clis.Cli();
cli.npcGame();
cli.table();
console.log(cli.game.waste);
process.exit();
