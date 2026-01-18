export abstract class Construct {
  protected get fqid(): string {
    return `${this.parent ? this.parent.id : ""}/${this.id}`;
  }

  protected readonly children: Construct[] = [];

  protected get descendants(): Construct[] {
    const children = [];
    children.push(...this.children);
    for (const c of this.children) {
      children.push(...c.descendants);
    }
    return children;
  }

  constructor(
    protected readonly parent: Construct | undefined,
    readonly id: string,
  ) {
    this.parent?.children.push(this);
  }
}
