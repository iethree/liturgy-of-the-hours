//logger
const chalk = require('chalk');
const util = require('util');

exports.err     =(...args)=> console.log(chalk.redBright(f(...args)));
exports.warn    =(...args)=> console.log(chalk.yellow(f(...args)));
exports.success =(...args)=> console.log(chalk.green(f(...args)));
exports.info    =(...args)=> console.log(chalk.cyan(f(...args)));
exports.debug   =(...args)=> console.log(chalk.bgMagenta(f(...args)));
exports.log     =(...args)=> console.log(...args);

//form output
function f(...args){
  return args.map(i=>{
    if( (typeof i === "object") && (i !== null) )
      return util.inspect(i);
    else
      return i;
  }).join(' ');
}
