import { withI18n } from "@turbostarter/i18n/with-i18n";

import {
  SantaHero,
  SantaBookingSection,
  SantaFaq,
  SantaFooter,
} from "~/modules/marketing/santacall";

const HomePage = () => {
  return (
    <>
      <SantaHero />
      <SantaBookingSection />
      <SantaFaq />
      <SantaFooter />
    </>
  );
};

export default withI18n(HomePage);
