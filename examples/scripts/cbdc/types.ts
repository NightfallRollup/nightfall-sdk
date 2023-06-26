
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
  description: string,  // Description of the token minted
  qty: number,          // Quantity of token minted
  type: number,         // Type of token
}

/**
 * Token information
 */
export interface TokenInfo {
  token: Token,
  sigR: string,
}