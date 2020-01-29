#!/usr/bin/env node
const npcs = require('../src/npc.js');
let opts = { draw3: false, passes: 0 };
let npc = new npcs.Npc(opts);
npc.play();
process.exit();
