#!/usr/bin/env node
// NOTE: the above is intentionally using node since that is the proper value after transpilation

import { homedir } from 'os';
import { sep } from 'path';
import { spawn } from 'child_process';
import { createCommand } from 'commander';
import { readFile, readdir } from 'fs/promises';
import { Options } from '../types';
import {
  display,
  displayTable,
  extendBaseCommand,
  parseAcf,
  stringifyForDisplay,
} from '../utils';

const cmd = createCommand();
cmd
  .name('launch')
  .argument('<name...>', 'The name of the game to launch')
  .option(
    '-a, --appId <appId>',
    'The AppId to launch if filtering by name alone will not suffice.',
  )
  .description('Attempts to launch a steam game by name')
  .showHelpAfterError(true);

extendBaseCommand(cmd);

type GameMatch = {
  appId: string;
  name?: string;
};

type AcfFileFragment = {
  AppState: {
    appid: string;
    name: string;
  };
};

async function findAppIdMatches(gameName: string): Promise<GameMatch[]> {
  const gameDir = [homedir(), '.steam', 'steam', 'steamapps'].join(sep);
  const contents = await readdir(gameDir);
  const metaFiles = contents.filter((elem) => elem.endsWith('.acf'));

  const promises = metaFiles.map(async (file) => {
    const filePath = [gameDir, file].join(sep);
    const fileBody = await readFile(filePath);
    const meta = parseAcf(fileBody.toString()) as AcfFileFragment;
    return meta;
  });

  const allMeta = await Promise.all(promises);

  const gameNameUpper = gameName.toLocaleUpperCase();
  return allMeta
    .filter((meta) => {
      const nameUpper = meta.AppState.name.toLocaleUpperCase();
      return nameUpper.indexOf(gameNameUpper) > -1;
    })
    .map((match) => ({
      appId: match.AppState.appid,
      name: match.AppState.name,
    }));
}

function launchGame(game: GameMatch) {
  if (game.name) {
    display(`Launching ${game.name}`);
  } else {
    display(`Launching ${game.appId}`);
  }
  const child = spawn('steam', [`steam://rungameid/${game.appId}`]);
  child.stdout.on('data', (data) => {
    display(data, true);
  });
  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
}

type Params = {
  appId?: number;
};

cmd.action(async (name: string[], options: Options<Params>) => {
  const gameName = name.join(' ');

  if (options.appId) {
    launchGame({ appId: `${options.appId}` });
    return;
  }

  if (options.verbose) {
    display(`Searching for: ${gameName}`);
  }

  const results = await findAppIdMatches(gameName);
  if (options.verbose) {
    display('Found the following game matches');
    display(stringifyForDisplay(results));
    display('');
  }

  if (results.length === 0) {
    display(
      `Could not find a match for "${gameName}" Are you sure it is installed?`,
    );
  } else if (results.length > 1) {
    display(`Multiple games found for: ${gameName}`);
    const headers = ['AppId', 'Name'];
    const rows = results.map((e) => [e.appId, e.name]);
    displayTable(rows, headers);
  } else {
    launchGame(results[0]);
  }
});

cmd.parseAsync(process.argv);
