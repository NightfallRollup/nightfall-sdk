export interface PurchaseOrder {
  part: string,
  docId: string,
  deliveryDate: Date,
  qty: number,
}

export interface Token {
  ercAddress: string,
  tokenId:string,
  tokenType:string,
  value:string,
  fee:string,
}