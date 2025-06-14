import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--flashio-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--flashio-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--flashio-elements-terminal-textColor'),
    background: cssVar('--flashio-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--flashio-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--flashio-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--flashio-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--flashio-elements-terminal-color-black'),
    red: cssVar('--flashio-elements-terminal-color-red'),
    green: cssVar('--flashio-elements-terminal-color-green'),
    yellow: cssVar('--flashio-elements-terminal-color-yellow'),
    blue: cssVar('--flashio-elements-terminal-color-blue'),
    magenta: cssVar('--flashio-elements-terminal-color-magenta'),
    cyan: cssVar('--flashio-elements-terminal-color-cyan'),
    white: cssVar('--flashio-elements-terminal-color-white'),
    brightBlack: cssVar('--flashio-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--flashio-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--flashio-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--flashio-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--flashio-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--flashio-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--flashio-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--flashio-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
