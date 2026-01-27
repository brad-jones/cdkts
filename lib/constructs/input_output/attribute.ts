export class Attribute {
  constructor(readonly id: string) {}

  atMapKey(key: string): Attribute {
    return new Proxy(new Attribute(`${this.id}.${key}`), {
      get(target, propName, _) {
        if (typeof propName === "string") {
          return target.atMapKey(propName);
        }
        if (typeof propName === "number") {
          return target.atIndex(propName);
        }
        if (propName === Symbol.toPrimitive) {
          return function (hint: any) {
            if (hint === "string") {
              return target.toString();
            }
            throw new Error(`toPrimitive not supported: ${hint}`);
          };
        }
        throw new Error(`atIndex not supported: ${String(propName)}`);
      },
    });
  }

  atIndex(index: number): Attribute {
    return new Proxy(new Attribute(`${this.id}[${index}]`), {
      get(target, propName, _) {
        if (typeof propName === "string") {
          return target.atMapKey(propName);
        }
        if (typeof propName === "number") {
          return target.atIndex(propName);
        }
        if (propName === Symbol.toPrimitive) {
          return function (hint: any) {
            if (hint === "string") {
              return target.toString();
            }
            throw new Error(`toPrimitive not supported: ${hint}`);
          };
        }
        throw new Error(`atIndex not supported: ${String(propName)}`);
      },
    });
  }

  toString(): string {
    return `\${${this.id}}`;
  }
}
