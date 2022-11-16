#!/usr/bin/env node
// NOTE: the above is intentionally using node since that is the proper value after transpilation

import { createCommand } from 'commander';
// import * as yargs from 'yargs';
// import { environmentMiddleware, mdsSdkInitMiddleware } from './middleware';

const app = createCommand();
app
  .name('steamy')
  .description('Steam CLI wrapper to make launching games from terminal easy')
  .executableDir('commands')
  .command('launch', 'launch a steam game via name');

app.parse(process.argv);
