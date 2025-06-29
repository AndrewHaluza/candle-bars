export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  static getInstance(): ServiceContainer {
    if (!this.instance) {
      this.instance = new ServiceContainer();
    }
    return this.instance;
  }

  register<T>(name: string, service: T): void {
    console.log(`Registering service: ${name}`);
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);

    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}
