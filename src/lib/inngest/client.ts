import { EventSchemas, Inngest } from "inngest";

type Events = {
  "cv.process_gdrive_link": {
    data: {
      candidateId: string;
      gdriveUrl: string;
    };
  };
  "cv.process_direct_upload": {
    data: {
      publicUrl: string;
      fileName: string;
      fileType: string; // MIME type, e.g. "application/pdf", "image/jpeg"
    };
  };
};

export const inngest = new Inngest({ 
  id: "mauna-kea-os",
  schemas: new EventSchemas().fromRecord<Events>(),
  eventKey: process.env.INNGEST_EVENT_KEY || "local"
});
