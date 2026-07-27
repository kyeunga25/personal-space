import { handle } from "@astrojs/cloudflare/handler";

import { D1EditionRepository } from "./server/editions/repository";
import { EditionAutomationService } from "./server/editions/service";

const INGEST_CRON = "15 0,12 * * *";
const EDITION_CRON = "0 14 * * *";

export default {
  fetch(request, environment, context) {
    return handle(request, environment, context);
  },
  async scheduled(controller, environment) {
    const service = new EditionAutomationService(
      new D1EditionRepository(environment.DB),
    );
    if (controller.cron === INGEST_CRON) {
      await service.ingest(new Date(controller.scheduledTime));
      return;
    }
    if (controller.cron === EDITION_CRON) {
      await service.generateDailyEdition(new Date(controller.scheduledTime));
    }
  },
} satisfies ExportedHandler<Cloudflare.Env>;
