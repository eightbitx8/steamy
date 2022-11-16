export function parseAcf(body: string): Record<string, unknown> {
  const result = {};

  // Remove the quotes from around each attribute
  const unquotedBody = body.replace(/"([^"]+(?="))"/g, '$1');

  // Break each line apart (os new-line independent)
  const lines = unquotedBody.split(/[\r]?\n/g);

  const stack: any[] = [];
  let currentKey = '';
  let parent = {};
  let current = {};

  for (let i = 0; i < lines.length - 1; i += 1) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    // Remove tabs
    const escapedLine = line.replace(/\t/g, '');
    const escapedNextLine = nextLine.replace(/\t/g, '');

    if (escapedNextLine === '{') {
      currentKey = escapedLine;

      if (Object.keys(parent).length === 0) {
        parent = result;
        stack.push(parent);
      } else {
        stack.push(current);
        parent = current;
      }
      parent[currentKey] = {};
      current = parent[currentKey];
    }

    if (
      escapedLine !== '{' &&
      escapedLine !== '}' &&
      escapedLine !== currentKey
    ) {
      const lineElements = line.split(/\t/g).filter((e) => e !== '');
      current[lineElements[0]] = lineElements[1];
    }

    if (escapedNextLine === '}') {
      current = stack.pop();
    }
  }

  return result;
}
