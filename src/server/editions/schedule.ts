export interface AutomationScheduleEnvironment {
  EDITION_CRON?: string;
  INGEST_CRON?: string;
}

export type ScheduledAutomationJob = "edition_generation" | "source_ingestion";

export function scheduledAutomationJob(
  cron: string,
  environment: AutomationScheduleEnvironment,
): ScheduledAutomationJob | null {
  const editionCron = environment.EDITION_CRON?.trim();
  const ingestCron = environment.INGEST_CRON?.trim();
  if (!editionCron || !ingestCron || editionCron === ingestCron) {
    throw new Error("automation_schedule_configuration_error");
  }
  if (cron === ingestCron) return "source_ingestion";
  if (cron === editionCron) return "edition_generation";
  return null;
}
