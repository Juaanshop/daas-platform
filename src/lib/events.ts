import { EventEmitter } from "events";

type DaasEventType =
  | "order:created"
  | "order:assigned"
  | "order:status_updated"
  | "rider:status_updated"
  | "rider:created"
  | "rider:updated"
  | "rider:deleted"
  | "merchant:created"
  | "merchant:updated"
  | "merchant:deleted";

export interface DaasEvent {
  type: DaasEventType;
  data: any;
  timestamp: string;
}

class EventHub extends EventEmitter {
  private static instance: EventHub;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): EventHub {
    if (!EventHub.instance) {
      EventHub.instance = new EventHub();
    }
    return EventHub.instance;
  }

  public broadcast(type: DaasEventType, data: any) {
    const event: DaasEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit("daas_event", event);
  }
}

export const eventHub = EventHub.getInstance();
