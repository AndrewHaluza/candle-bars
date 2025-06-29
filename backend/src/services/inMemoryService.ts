export class InMemoryService<TData, TId = string> {
  private store: Map<TId, TData[]>;

  constructor() {
    this.store = new Map<TId, TData[]>();
  }

  public set(id: TId, item: TData): void {
    const items = this.store.get(id);
    
    if (items) {
      items.push(item);
    } else {
      this.store.set(id, [item]);
    }
  }

  public get(id: TId): TData[] | undefined {
    return this.store.get(id);
  }

  public length(id: TId): number {
    const items = this.store.get(id);
    return items ? items.length : 0;
  }

  public delete(id: TId): boolean {
    return this.store.delete(id);
  }

  public clear(id: TId): void {
    this.store.delete(id);
  }
}

export type InMemoryServiceType<TData, TId = string> = InMemoryService<
  TData,
  TId
>;
