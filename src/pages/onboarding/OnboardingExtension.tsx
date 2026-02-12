import { useTranslation } from "react-i18next";

import { Button } from "@/components/buttons/Button";
import { CenterContainer } from "@/components/layout/ThinContainer";
import { Heading2, Paragraph } from "@/components/utils/Text";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import { useNavigateOnboarding } from "@/pages/onboarding/onboardingHooks";
import { Link } from "@/pages/onboarding/utils";
import { PageTitle } from "@/pages/parts/util/PageTitle";

export function OnboardingExtensionPage() {
  const { t } = useTranslation();
  const navigate = useNavigateOnboarding();

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.onboarding" />
      <CenterContainer>
        <Heading2 className="!mt-0 !text-3xl max-w-[500px] text-center">
          {t("onboarding.extension.title")}
        </Heading2>
        <Paragraph className="max-w-[520px] !mb-6 text-center">
          Browser-extension routing has been deprecated. p-stream now routes
          external requests through secure Convex actions with a strict
          allowlist.
        </Paragraph>
        <Link href="https://github.com/p-stream/p-stream" target="_blank">
          Learn more about the migration
        </Link>
        <div className="mt-10">
          <Button theme="purple" onClick={() => navigate("/onboarding/proxy")}>
            Continue
          </Button>
        </div>
      </CenterContainer>
    </MinimalPageLayout>
  );
}
