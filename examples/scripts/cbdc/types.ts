/**
 * Token type for bank token
 */
export enum TokenType {
  wCBDC = 0,
  rCBDC = 1,
}

/**
 * Asset representation of token minted by banks
 */
export interface Token {
  qty: number; // Quantity of token minted
  type: number; // Type of token
  decimals: number; // Number of decimals
  symbol: string; // Symbol of the token
}
