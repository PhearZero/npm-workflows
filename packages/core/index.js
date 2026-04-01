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
}

export default Account;