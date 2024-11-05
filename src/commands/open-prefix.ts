import { Table } from '@cliffy/table';
import { Command, ValidationError } from '@cliffy/command';
import { findAppIdMatches, type GameMatch } from './common.ts';

const _homedir = Deno.env.get('HOME');

type openPrefixHandlerType = (
  { appId, name }: { appId?: string; name: string },
) => Promise<void>;

function linuxOpenPrefix(game: GameMatch) {
  const prefixDir = [
    _homedir,
    '.steam',
    'steam',
    'steamapps',
    'compatdata',
    game.appId.toString(),
  ].join('/');

  console.log(`Opening prefix for ${game.name}...`);

  const cmd = new Deno.Command('xdg-open', { args: [prefixDir] });
  cmd.spawn();
}

async function linuxOpenPrefixHandler(
  { appId, name }: { appId?: string; name: string },
) {
  if (appId) {
    linuxOpenPrefix({ appId: parseInt(appId), name });
    return;
  }

  const matches = await findAppIdMatches(name);

  if (matches.length === 0) {
    console.log(`No matches found for ${name}. Are you sure it is installed?`);
  } else if (matches.length > 1) {
    console.log(`Multiple matches found for ${name}.`);
    new Table()
      .body(matches.map((match) => [match.appId, match.name]))
      .header(['AppId', 'Name'])
      .border(true)
      .render();
  } else {
    linuxOpenPrefix(matches[0]);
  }
}

export const openPrefix = new Command()
  .name('openPrefix')
  .description('Open the prefix folder')
  .option(
    '-a, --appId <appId:string>',
    'The AppId to launch if filtering by name alone will not suffice.',
  )
  .option('-v, --verbose', 'Show verbose output')
  .arguments('<name...>')
  .action(async ({ appId, verbose: _verbose }, ...name) => {
    // TODO: Implement verbose output
    const gameName = name.join(' ');

    const handlers: Record<string, (undefined | openPrefixHandlerType)> = {
      // NOTE: having a prefix for windows doesn't make sense
      linux: linuxOpenPrefixHandler,
    };

    const handler = handlers[Deno.build.os];
    if (!handler) {
      throw new ValidationError(`Unsupported OS: ${Deno.build.os}`);
    }

    await handler({ appId, name: gameName });
  });
