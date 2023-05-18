
/**
 * Token type for supply chain tokens
 */
export enum TokenType {
  PurchaseOrder = 0,
  Asset = 1,
}

/**
 * Purchase order of goods
 */
export interface PurchaseOrder {
  part: string,         // Good id to mint with this PO
  poId: string,         // Purchase order Id
  deliveryDate: Date,   // Estimated delivery date for the good to mint
  qty: number,          // Quantity of good to mint with this PO
}

/**
 * Asset representation of the good
 */
export interface Asset {
  part: string,   // Good id
  poId: string,   // Purchase order Id that has produced this good
  batch: string,  // Batch number of the goods
  qty: number,    // Quantity of good for this batch number
}

/**
 * Token type for supply chain
 */
export type Token = PurchaseOrder | Asset; 

/**
 * Token information
 */
export interface TokenInfo {
  token: Token,
  sigR: string,
}
