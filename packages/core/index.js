export class Account {
  constructor(address) {
    this.address = address;
    this.metadata = {};
  }

  getAddress() {
    return this.address;
  }
  getMetadata() {
    return this.metadata;
  }

  save(metadata) {
    if(typeof metadata !== 'object') throw new Error("Metadata must be an object");
    this.metadata = metadata;
  }
}

export default Account;

export function isAccount(account) { return account instanceof Account; }