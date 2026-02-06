/**
 * Base class for all constructs in the CDKTS ecosystem.
 *
 * Constructs form a tree structure where each construct has a parent (except for the root)
 * and can have multiple children. This hierarchy enables resource organization and
 * logical scoping within infrastructure definitions.
 */
export abstract class Construct {
  /**
   * The fully qualified identifier (FQID) of this construct.
   *
   * The FQID is constructed by concatenating the parent's ID with this construct's ID,
   * separated by a forward slash. For root constructs without a parent, only the ID is used.
   *
   * @returns The fully qualified identifier path (e.g., "parent/child")
   */
  get fqid(): string {
    return `${this.parent ? this.parent.id : ""}/${this.id}`;
  }

  /**
   * Direct child constructs of this construct.
   *
   * Children are automatically added to this array when they are instantiated
   * with this construct as their parent.
   */
  readonly children: Construct[] = [];

  /**
   * All descendant constructs of this construct, including children and their descendants.
   *
   * This getter recursively traverses the construct tree to collect all descendants
   * in depth-first order.
   *
   * @returns An array containing all descendant constructs
   */
  get descendants(): Construct[] {
    const children = [];
    children.push(...this.children);
    for (const c of this.children) {
      children.push(...c.descendants);
    }
    return children;
  }

  /**
   * Creates a new construct.
   *
   * When a construct is created with a parent, it is automatically registered
   * as a child of that parent construct.
   *
   * @param parent - The parent construct, or undefined for root constructs
   * @param id - The scoped identifier for this construct within its parent
   */
  constructor(
    readonly parent: Construct | undefined,
    readonly id: string,
  ) {
    this.parent?.children.push(this);
  }
}
