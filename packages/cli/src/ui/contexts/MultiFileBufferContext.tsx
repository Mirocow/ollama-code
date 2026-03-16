/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import {
  MultiFileBufferManager,
  FileBuffer,
  BufferListEntry,
  BufferEvent,
  getBufferManager,
} from '@ollama-code/ollama-code-core';

// State shape for the context
interface BufferState {
  buffers: BufferListEntry[];
  activeBuffer: FileBuffer | null;
  previousBuffer: FileBuffer | null;
  bufferCount: number;
  hasDirtyBuffers: boolean;
  isLoading: boolean;
  error: string | null;
}

// Alias for hasDirtyBuffers (for API consistency)
const hasDirtyBuffersAlias = 'hasDirtyBuffers';

// Action types for the reducer
type BufferAction =
  | { type: 'SET_BUFFERS'; buffers: BufferListEntry[] }
  | { type: 'SET_ACTIVE_BUFFER'; buffer: FileBuffer | null }
  | { type: 'SET_PREVIOUS_BUFFER'; buffer: FileBuffer | null }
  | { type: 'SET_DIRTY_STATUS'; hasDirty: boolean }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

// Initial state
const initialState: BufferState = {
  buffers: [],
  activeBuffer: null,
  previousBuffer: null,
  bufferCount: 0,
  hasDirtyBuffers: false,
  isLoading: false,
  error: null,
};

// Reducer function
function bufferReducer(state: BufferState, action: BufferAction): BufferState {
  switch (action.type) {
    case 'SET_BUFFERS':
      return {
        ...state,
        buffers: action.buffers,
        bufferCount: action.buffers.length,
      };
    case 'SET_ACTIVE_BUFFER':
      return {
        ...state,
        activeBuffer: action.buffer,
      };
    case 'SET_PREVIOUS_BUFFER':
      return {
        ...state,
        previousBuffer: action.buffer,
      };
    case 'SET_DIRTY_STATUS':
      return {
        ...state,
        hasDirtyBuffers: action.hasDirty,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context type
interface MultiFileBufferContextType {
  // State
  buffers: BufferListEntry[];
  activeBuffer: FileBuffer | null;
  previousBuffer: FileBuffer | null;
  bufferCount: number;
  hasDirtyBuffers: boolean;
  isLoading: boolean;
  error: string | null;

  // Buffer operations
  openBuffer: (filePath: string, content?: string) => Promise<FileBuffer | null>;
  closeBuffer: (bufferNumber: number, force?: boolean) => { success: boolean; error?: string };
  closeCurrentBuffer: (force?: boolean) => { success: boolean; error?: string };
  saveBuffer: (filePath?: string) => Promise<{ success: boolean; error?: string }>;
  saveAllBuffers: () => Promise<{ success: boolean; errors: string[] }>;

  // Navigation
  nextBuffer: () => FileBuffer | null;
  previousBuffer: () => FileBuffer | null;
  alternateBuffer: () => FileBuffer | null;
  switchToBuffer: (bufferNumber: number) => FileBuffer | null;

  // Content management
  updateBufferContent: (
    filePath: string,
    content: string,
    cursorLine?: number,
    cursorColumn?: number,
  ) => FileBuffer | null;

  // Utilities
  getBufferByNumber: (bufferNumber: number) => FileBuffer | null;
  getBufferByPath: (filePath: string) => FileBuffer | null;
  getBufferList: () => BufferListEntry[];
  getDirtyBuffers: () => FileBuffer[];
  reloadBuffer: (
    bufferNumber: number,
    force?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;

  // Manager instance (for advanced use)
  manager: MultiFileBufferManager;
}

const MultiFileBufferContext = createContext<MultiFileBufferContextType | undefined>(
  undefined,
);

interface MultiFileBufferProviderProps {
  children: React.ReactNode;
  manager?: MultiFileBufferManager;
}

export const MultiFileBufferProvider = ({
  children,
  manager: providedManager,
}: MultiFileBufferProviderProps) => {
  const managerRef = useRef<MultiFileBufferManager>(
    providedManager ?? getBufferManager(),
  );
  const [state, dispatch] = useReducer(bufferReducer, initialState);

  // Sync state from manager
  const syncState = useCallback(() => {
    const bufferList = managerRef.current.getBufferList();
    dispatch({ type: 'SET_BUFFERS', buffers: bufferList });
    dispatch({
      type: 'SET_ACTIVE_BUFFER',
      buffer: managerRef.current.getActiveBuffer(),
    });
    dispatch({
      type: 'SET_DIRTY_STATUS',
      hasDirty: managerRef.current.hasDirtyBuffers(),
    });
  }, []);

  // Subscribe to buffer events
  useEffect(() => {
    const unsubscribe = managerRef.current.addListener((event: BufferEvent) => {
      syncState();

      if (event.type === 'buffer_switched' && event.buffer) {
        dispatch({ type: 'SET_ACTIVE_BUFFER', buffer: event.buffer });
      }
    });

    // Initial sync
    syncState();

    return unsubscribe;
  }, [syncState]);

  // Buffer operations
  const openBuffer = useCallback(
    async (filePath: string, content?: string): Promise<FileBuffer | null> => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'SET_ERROR', error: null });

      try {
        const buffer = await managerRef.current.openBuffer(filePath, content);
        syncState();
        return buffer;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        dispatch({ type: 'SET_ERROR', error: errorMsg });
        return null;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    [syncState],
  );

  const closeBuffer = useCallback(
    (bufferNumber: number, force: boolean = false) => {
      const result = managerRef.current.deleteBuffer(bufferNumber, force);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  const closeCurrentBuffer = useCallback(
    (force: boolean = false) => {
      const result = managerRef.current.closeCurrentBuffer(force);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  const saveBuffer = useCallback(
    async (filePath?: string): Promise<{ success: boolean; error?: string }> => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        const result = await managerRef.current.saveBuffer(filePath);
        if (result.success) {
          syncState();
        }
        return result;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    [syncState],
  );

  const saveAllBuffers = useCallback(async (): Promise<{
    success: boolean;
    errors: string[];
  }> => {
    const dirtyBuffers = managerRef.current.getDirtyBuffers();
    const errors: string[] = [];

    for (const buffer of dirtyBuffers) {
      const result = await managerRef.current.saveBuffer(buffer.filePath);
      if (!result.success && result.error) {
        errors.push(`${buffer.filePath}: ${result.error}`);
      }
    }

    syncState();
    return { success: errors.length === 0, errors };
  }, [syncState]);

  // Navigation
  const nextBuffer = useCallback((): FileBuffer | null => {
    const buffer = managerRef.current.nextBuffer();
    syncState();
    return buffer;
  }, [syncState]);

  const previousBuffer = useCallback((): FileBuffer | null => {
    const buffer = managerRef.current.previousBuffer();
    syncState();
    return buffer;
  }, [syncState]);

  const alternateBuffer = useCallback((): FileBuffer | null => {
    const buffer = managerRef.current.alternateBuffer();
    syncState();
    return buffer;
  }, [syncState]);

  const switchToBuffer = useCallback(
    (bufferNumber: number): FileBuffer | null => {
      const buffer = managerRef.current.switchToBuffer(bufferNumber);
      syncState();
      return buffer;
    },
    [syncState],
  );

  // Content management
  const updateBufferContent = useCallback(
    (
      filePath: string,
      content: string,
      cursorLine?: number,
      cursorColumn?: number,
    ): FileBuffer | null => {
      const buffer = managerRef.current.updateBufferContent(
        filePath,
        content,
        cursorLine,
        cursorColumn,
      );
      syncState();
      return buffer;
    },
    [syncState],
  );

  // Utilities
  const getBufferByNumber = useCallback((bufferNumber: number) => {
    return managerRef.current.getBufferByNumber(bufferNumber);
  }, []);

  const getBufferByPath = useCallback((filePath: string) => {
    return managerRef.current.getBufferByPath(filePath);
  }, []);

  const getBufferList = useCallback(() => {
    return managerRef.current.getBufferList();
  }, []);

  const reloadBuffer = useCallback(
    async (
      bufferNumber: number,
      force: boolean = false,
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await managerRef.current.reloadBuffer(bufferNumber, force);
      if (result.success) {
        syncState();
      }
      return result;
    },
    [syncState],
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const value: MultiFileBufferContextType = {
    // State
    ...state,

    // Buffer operations
    openBuffer,
    closeBuffer,
    closeCurrentBuffer,
    saveBuffer,
    saveAllBuffers,

    // Navigation
    nextBuffer,
    previousBuffer,
    alternateBuffer,
    switchToBuffer,

    // Content management
    updateBufferContent,

    // Utilities
    getBufferByNumber,
    getBufferByPath,
    getBufferList,
    reloadBuffer,
    clearError,

    // Manager
    manager: managerRef.current,
  };

  return (
    <MultiFileBufferContext.Provider value={value}>
      {children}
    </MultiFileBufferContext.Provider>
  );
};

/**
 * Hook to access the multi-file buffer context
 */
export const useMultiFileBuffers = (): MultiFileBufferContextType => {
  const context = useContext(MultiFileBufferContext);
  if (context === undefined) {
    throw new Error(
      'useMultiFileBuffers must be used within a MultiFileBufferProvider',
    );
  }
  return context;
};

export { MultiFileBufferManager, FileBuffer, BufferListEntry, BufferEvent };
