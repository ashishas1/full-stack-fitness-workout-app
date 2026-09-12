import { EventEmitter } from 'node:events';
import { logger } from '../../utils/logger';

export interface DomainEvent<T = any> {
  id: string;
  type:
    | 'WorkoutCompleted'
    | 'PaymentSucceeded'
    | 'PaymentFailed'
    | 'MembershipExpiring'
    | 'PRDetected'
    | 'AchievementUnlocked'
    | 'UserRegistered';
  timestamp: Date;
  payload: T;
  correlationId?: string;
}

export class DomainEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  public subscribe<T = any>(
    eventType: DomainEvent['type'],
    handler: (event: DomainEvent<T>) => Promise<void> | void
  ): void {
    this.emitter.on(eventType, async (event: DomainEvent<T>) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error processing domain event [${eventType}]`, {
          eventId: event.id,
          error,
        });
      }
    });
  }

  public async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    logger.info(`Domain Event Published: ${event.type}`, {
      eventId: event.id,
      correlationId: event.correlationId,
    });

    // Fire asynchronously on the next tick so the HTTP handler is not blocked
    setImmediate(() => {
      this.emitter.emit(event.type, event);
    });
  }
}

export const eventBus = new DomainEventBus();
