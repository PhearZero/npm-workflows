export class Account {
  constructor(address) {
    this.address = address;
    this.metadata = {};
  }

  getAddress() {
    return this.address;
  }
}
