import chalk from 'chalk';

function stringify(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack ?? arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function fmt(args: unknown[]): string {
  return args.map(stringify).join(' ');
}

export const log = {
  info: (...args: unknown[]): void => {
    console.log(chalk.cyan(fmt(args)));
  },
  warn: (...args: unknown[]): void => {
    console.warn(chalk.yellow(fmt(args)));
  },
  err: (...args: unknown[]): void => {
    console.error(chalk.red(fmt(args)));
  },
  success: (...args: unknown[]): void => {
    console.log(chalk.green(fmt(args)));
  },
};

export default log;
