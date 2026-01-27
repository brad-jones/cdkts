export class Attribute {
  constructor(readonly id: string) {}

  atMapKey(key: string): Attribute {
    return new Attribute(`${this.id}.${key}`);
  }

  atIndex(index: number): Attribute {
    return new Attribute(`${this.id}[${index}]`);
  }

  toString(): string {
    return `\${${this.id}}`;
  }
}
