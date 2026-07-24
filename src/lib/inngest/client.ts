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
    };
  };
};

export const inngest = new Inngest({ 
  id: "mauna-kea-os",
  schemas: new EventSchemas().fromRecord<Events>()
});
