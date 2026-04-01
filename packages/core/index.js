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
    this.metadata = metadata;
  }
}

export default Account;

export function isAccount(account) { return account instanceof Account; }