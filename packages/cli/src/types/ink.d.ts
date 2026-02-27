declare module 'ink' {
  import type { ComponentType, ReactNode, RefObject } from 'react';

  export interface DOMElement {
    toString(): string;
  }

  export interface RenderOptions {
    stdout?: NodeJS.WriteStream;
    stderr?: NodeJS.WriteStream;
    stdin?: NodeJS.ReadStream;
    debug?: boolean;
    exitOnCtrlC?: boolean;
    patchConsole?: boolean;
    waitUntilExit?: () => Promise<void>;
    isScreenReaderEnabled?: boolean;
  }

  export interface RenderResult {
    rerender: (node: ReactNode) => void;
    unmount: () => void;
    waitUntilExit: () => Promise<void>;
    cleanup: () => void;
  }

  export function render(
    node: ReactNode,
    options?: RenderOptions,
  ): RenderResult;

  export interface BoxProps {
    children?: ReactNode;
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingX?: number;
    paddingY?: number;
    padding?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    marginX?: number;
    marginY?: number;
    margin?: number;
    borderStyle?:
      | 'single'
      | 'double'
      | 'round'
      | 'bold'
      | 'singleDouble'
      | 'doubleSingle'
      | 'classic';
    borderColor?: string;
    borderDimColor?: boolean;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
    alignContent?:
      | 'flex-start'
      | 'center'
      | 'flex-end'
      | 'stretch'
      | 'space-between'
      | 'space-around';
    justifyContent?:
      | 'flex-start'
      | 'center'
      | 'flex-end'
      | 'space-between'
      | 'space-around'
      | 'space-evenly';
    gap?: number;
    rowGap?: number;
    columnGap?: number;
    alignSelf?:
      | 'auto'
      | 'flex-start'
      | 'center'
      | 'flex-end'
      | 'stretch'
      | 'baseline';
    overflow?: 'visible' | 'hidden';
    overflowX?: 'visible' | 'hidden';
    overflowY?: 'visible' | 'hidden';
    display?: 'flex' | 'none';
    position?: 'static' | 'absolute' | 'relative';
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    ref?: RefObject<DOMElement | null>;
  }

  export const Box: ComponentType<BoxProps>;

  export interface TextProps {
    children?: ReactNode;
    color?: string;
    backgroundColor?: string;
    dimColor?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    hidden?: boolean;
    wrap?:
      | 'wrap'
      | 'end'
      | 'truncate'
      | 'truncate-start'
      | 'truncate-middle'
      | 'truncate-end';
    overflow?:
      | 'visible'
      | 'hidden'
      | 'truncate'
      | 'truncate-start'
      | 'truncate-middle'
      | 'truncate-end';
    ellipsis?: boolean;
  }

  export const Text: ComponentType<TextProps>;

  export interface NewlineProps {
    count?: number;
  }

  export const Newline: ComponentType<NewlineProps>;

  export interface SpacerProps {
    children?: ReactNode;
  }

  export const Spacer: ComponentType<SpacerProps>;

  export interface StaticProps<T = unknown> {
    children?: (item: T, index: number) => ReactNode;
    items?: readonly T[];
    style?: object;
    key?: string | number;
  }

  export function Static<T = unknown>(props: StaticProps<T>): ReactNode;

  export function useStdin(): {
    stdin: NodeJS.ReadStream;
    setRawMode: (mode: boolean) => void;
    isRaw: boolean | undefined;
  };

  export function useStdout(): {
    stdout: NodeJS.WriteStream;
    write: (data: string) => void;
  };

  export function useStderr(): {
    stderr: NodeJS.WriteStream;
    write: (data: string) => void;
  };

  export function useApp(): {
    exit: (errorCode?: number) => void;
    waitUntilExit: () => Promise<void>;
  };

  export function useInput(
    inputHandler: (input: string, key: Key) => void,
    options?: { isActive?: boolean },
  ): void;

  export interface Key {
    upArrow: boolean;
    downArrow: boolean;
    leftArrow: boolean;
    rightArrow: boolean;
    return: boolean;
    escape: boolean;
    ctrl: boolean;
    shift: boolean;
    tab: boolean;
    backspace: boolean;
    delete: boolean;
    pageUp: boolean;
    pageDown: boolean;
    meta: boolean;
  }

  export function useFocus(options?: { autoFocus?: boolean }): {
    isFocused: boolean;
    focus: () => void;
    blur: () => void;
  };

  export function useMeasure(): [
    RefObject<DOMElement | null>,
    { width: number; height: number },
  ];

  export function measureElement(ref: DOMElement): {
    width: number;
    height: number;
  };

  export function useIsScreenReaderEnabled(): boolean;
}
