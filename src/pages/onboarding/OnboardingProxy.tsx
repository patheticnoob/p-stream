import { useTranslation } from "react-i18next";

import { Button } from "@/components/buttons/Button";
import { Stepper } from "@/components/layout/Stepper";
import { CenterContainer } from "@/components/layout/ThinContainer";
import { Divider } from "@/components/utils/Divider";
import { Heading2, Paragraph } from "@/components/utils/Text";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import {
  useNavigateOnboarding,
  useRedirectBack,
} from "@/pages/onboarding/onboardingHooks";
import { PageTitle } from "@/pages/parts/util/PageTitle";

export function OnboardingProxyPage() {
  const { t } = useTranslation();
  const navigate = useNavigateOnboarding();
  const { completeAndRedirect } = useRedirectBack();

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.onboarding" />
      <CenterContainer>
        <Stepper steps={2} current={2} className="mb-12" />
        <Heading2 className="!mt-0 !text-3xl max-w-[480px] text-center">
          {t("onboarding.proxy.title")}
        </Heading2>
        <Paragraph className="max-w-[520px] !mb-10 text-center">
          Manual proxy onboarding has been deprecated. External origin requests
          are now routed through Convex proxy actions with centralized
          allowlisting, retries, and response normalization.
        </Paragraph>
        <Divider />
        <div className="flex justify-between w-full mt-8">
          <Button theme="secondary" onClick={() => navigate("/onboarding")}>
            {t("onboarding.proxy.back")}
          </Button>
          <Button theme="purple" onClick={completeAndRedirect}>
            Continue
          </Button>
        </div>
      </CenterContainer>
    </MinimalPageLayout>
  );
}
