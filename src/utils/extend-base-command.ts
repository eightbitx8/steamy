import { Command, createOption } from 'commander';

export function extendBaseCommand(command: Command) {
  const opt = createOption(
    '-v, --verbose',
    'Emit more information while processing',
  ).default(false);
  command.addOption(opt);
}
