export type SaveAction = "archive" | "publish" | "save" | "schedule";

export interface SaveRequest {
  action: SaveAction;
  quiet: boolean;
}

function mergeQueuedAutosave<T extends SaveRequest>(
  current: T,
  incoming: T,
): T {
  return {
    ...incoming,
    quiet: current.quiet && incoming.quiet,
  };
}

export class SerialSaveQueue<T extends SaveRequest = SaveRequest> {
  private active: Promise<void> | null = null;
  private queued: T[] = [];

  constructor(private readonly perform: (request: T) => Promise<void>) {}

  enqueue(request: T): Promise<void> {
    const last = this.queued.at(-1);
    if (!last) {
      this.queued.push(request);
    } else if (request.action === "save") {
      if (last.action === "save") {
        this.queued[this.queued.length - 1] = mergeQueuedAutosave(
          last,
          request,
        );
      } else {
        this.queued.push(request);
      }
    } else {
      this.queued = [request];
    }

    if (!this.active) {
      this.active = this.drain().finally(() => {
        this.active = null;
      });
    }
    return this.active;
  }

  private async drain(): Promise<void> {
    while (this.queued.length > 0) {
      const request = this.queued.shift();
      if (!request) return;
      await this.perform(request);
    }
  }
}
