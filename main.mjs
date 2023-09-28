// const fs = require('fs')
// const LS = require('./LambdaScript')
// const {Bot, listen} = require('./bot')

import * as repl from 'repl';
import * as fs from 'fs';
import * as https from 'https';
import * as querystring from 'querystring';
import * as RL from './run-lambda.mjs'
import { Bot, listen } from './bot.mjs'

global.Bot = Bot
global.listen = listen
global.machines = [];
global.replmidx = 0;

global.pprint = console.log.bind(console);

function evaluate(cmd, context, filename, callback) {
  let ok, val;
  [ok, val] = RL.interact(global.machines[global.replmidx], cmd);
  if(ok) callback(null, val);
  else process.stdout.write("> ");
}

let args = process.argv.slice(2);

let interact = !args.length;

var mode = "ls";
var units = [], chunk = [];
let modes =
  { "--": "ls" ,
    "-j": "js" ,
    "-l": "ls" ,
    "--js": "js" ,
    "--ls": "ls" };

let rf = fn => fs.readFileSync(
  fn, {encoding:'utf8', flag:'r'})

while(args.length){
  let v = args.shift()
  if(["-i", "--interact", "--repl"].includes(v))
    interact = 1;
  else if(["-h", "--help"].includes(v)){
    console.log(`\nUsage: node main.js [OPTION]... [LambdaScript]...`)
    console.log(`\nOPTION:`)
    console.log(`\n-h, --help                       Show the manual`)
    console.log(`\n-i, --interact, --repl           Enable repl mode`)
    console.log(`\n-j, --js      [JavaScript...]    Load JavaScript to context`)
    console.log(`\n-l, --ls, --  [LambdaScript ...] Load LambdaScripts in a machine`)
    console.log(`\nREPL:`)
    console.log(`\nIn REPL mode, you will be given a REPL in LambdaScript in first machine.`)
    console.log(`(if no script be loaded, it will "new" a machine for you.)`)
    console.log(`\nYou can check machines by variable "machines",`)
    console.log(`And change current REPL machine by "global.replmidx = [machine index]"`)
    console.log(`\nExamples:`)
    console.log(`\n$ # Run it interativly`)
    console.log(`$ node main.js`)
    console.log(`\n$ # Run the script`)
    console.log(`$ node main.js script/werewolf.js`)
    console.log(`\n$ # Run scripts with different machines and enable repl`)
    console.log(`$ node main.js -i script/werewolf.js -- script/werewolf.js`)
    process.exit(0)
  }
  else if(modes[v]){
    if(chunk.length){
      units.push(mode);
      try{ units.push(chunk.map(rf).join('\n')) }
      catch(e){ console.log(e); process.exit(-1); }
      chunk = [];
    }
    mode = modes[v];
  }
  else chunk.push(v);
}

if(chunk.length){
  units.push(mode);
  try{ units.push(chunk.map(rf).join('\n')) }
  catch(e){ console.log(e); process.exit(-1); }
  chunk = [];
}

while(units.length){
  let [m, code] = [units.shift(), units.shift()];
  try{
    if(m == "ls"){
      let [ok, machine] = RL.execute(code);
      global.machines.push(ok ? machine : new RL.Machine());
    }
    else eval(code);
  }
  catch(e){ console.log(e), process.exit(-1); }
}
if(interact){
  if(!global.machines.length)
    global.machines.push(new RL.Machine());
  //repl.start({ prompt: '> ', eval: evaluate });
  repl.start({ prompt: '> ', eval: evaluate })
  .on('exit', () => {console.log("bye!"), process.exit(0)});
}
