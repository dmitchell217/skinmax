/**
 * Style boards utilities for Looks Playground
 */

export interface StyleItem {
  title: string;
  rationale: string;
  image_urls?: string[];
  affiliate_url?: string;
}

export interface StyleBoard {
  haircuts: StyleItem[];
  beards: StyleItem[];
  glasses: StyleItem[];
}

export interface StyleBoardsData {
  oval: StyleBoard;
  round: StyleBoard;
  heart: StyleBoard;
  square: StyleBoard;
}

let styleBoardsCache: StyleBoardsData | null = null;

/**
 * Load style boards data from JSON file
 */
export async function loadStyleBoards(): Promise<StyleBoardsData> {
  if (styleBoardsCache) {
    return styleBoardsCache;
  }

  try {
    // In Next.js, we can use fs to read from the data directory
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'style_boards.json');
    const fileContents = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContents) as StyleBoardsData;
    styleBoardsCache = data;
    return data;
  } catch (error) {
    console.error('Error loading style boards:', error);
    throw new Error('Failed to load style boards data');
  }
}

/**
 * Get style board for a specific face shape
 */
export async function getStyleBoard(shape: 'oval' | 'round' | 'heart' | 'square'): Promise<StyleBoard> {
  const boards = await loadStyleBoards();
  
  if (!(shape in boards)) {
    throw new Error(`Unknown face shape: ${shape}`);
  }

  return boards[shape];
}

/**
 * Get glasses recommendations for a specific face shape
 */
export async function getGlasses(shape: 'oval' | 'round' | 'heart' | 'square'): Promise<StyleItem[]> {
  const board = await getStyleBoard(shape);
  return board.glasses;
}

/**
 * Get merged style boards for low confidence scenarios
 * Returns boards from two shapes merged with a note
 */
export async function getMergedStyleBoard(
  shape1: 'oval' | 'round' | 'heart' | 'square',
  shape2: 'oval' | 'round' | 'heart' | 'square'
): Promise<{ board: StyleBoard; note: string }> {
  const boards = await loadStyleBoards();
  const board1 = boards[shape1];
  const board2 = boards[shape2];

  return {
    board: {
      haircuts: [...board1.haircuts, ...board2.haircuts],
      beards: [...board1.beards, ...board2.beards],
      glasses: [...board1.glasses, ...board2.glasses],
    },
    note: 'Low confidence—photo angle/lighting may affect shape. Showing recommendations for both possible shapes.',
  };
}

