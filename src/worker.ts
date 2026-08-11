import { handle } from "@astrojs/cloudflare/handler";

import { D1EditionRepository } from "./server/editions/repository";
import { scheduledAutomationJob } from "./server/editions/schedule";
import { EditionAutomationService } from "./server/editions/service";

function logAutomation(
  job: "edition_generation" | "source_ingestion",
  result: {
    attemptCount: number;
    duplicate: boolean;
    report: unknown;
    runId: string;
    status: string;
  },
): void {
  let counts: Record<string, number> = {};
  if (result.report && typeof result.report === "object") {
    if ("entries" in result.report && Array.isArray(result.report.entries)) {
      counts = { editionItems: result.report.entries.length };
    } else {
      counts = Object.fromEntries(
        Object.entries(result.report).filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === "number" && Number.isFinite(entry[1]),
        ),
      );
    }
  }
  console.log(
    JSON.stringify({
      attemptCount: result.attemptCount,
      counts,
      duplicate: result.duplicate,
      event: "automation_run",
      job,
      runId: result.runId,
      status: result.status,
    }),
  );
}

export default {
  fetch(request, environment, context) {
    return handle(request, environment, context);
  },
  async scheduled(controller, environment) {
    const service = new EditionAutomationService(
      new D1EditionRepository(environment.DB),
    );
    try {
      const scheduledAt = new Date(controller.scheduledTime);
      const job = scheduledAutomationJob(controller.cron, environment);
      if (job === "source_ingestion") {
        const result = await service.runIngestion({
          scheduledAt,
          trigger: "cron",
        });
        logAutomation("source_ingestion", result);
        if (result.status === "failed") {
          throw new Error("source_ingestion_failed");
        }
        return;
      }
      if (job === "edition_generation") {
        const result = await service.runEditionGeneration({
          scheduledAt,
          trigger: "cron",
        });
        logAutomation("edition_generation", result);
        if (result.status === "failed") {
          throw new Error("edition_generation_failed");
        }
        return;
      }
      console.warn(
        JSON.stringify({
          event: "automation_run",
          job: "unknown",
          status: "ignored",
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          code: "automation_handler_error",
          event: "automation_error",
        }),
      );
      throw error;
    }
  },
} satisfies ExportedHandler<Cloudflare.Env>;
