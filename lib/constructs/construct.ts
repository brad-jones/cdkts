export abstract class Construct {
  get fqid(): string {
    return `${this.parent ? this.parent.id : ""}/${this.id}`;
  }

  readonly children: Construct[] = [];

  get descendants(): Construct[] {
    const children = [];
    children.push(...this.children);
    for (const c of this.children) {
      children.push(...c.descendants);
    }
    return children;
  }

  constructor(
    readonly parent: Construct | undefined,
    readonly id: string,
  ) {
    this.parent?.children.push(this);
  }
}
