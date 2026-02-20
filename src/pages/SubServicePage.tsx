import { Link, useParams } from "react-router-dom";
import GoogleAdsSubServiceLayout from "@/components/GoogleAdsSubServiceLayout";
import { getSubServicePage } from "@/lib/subServicePages";

const SubServicePage = () => {
  const { categorySlug, serviceSlug } = useParams();
  const content = getSubServicePage(categorySlug, serviceSlug);

  if (!content) {
    return (
      <section className="section-padding">
        <div className="container-max max-w-3xl">
          <div className="service-card text-center">
            <h1 className="font-display text-3xl font-bold mb-3">Page Not Found</h1>
            <p className="text-muted-foreground mb-6">This sub-service page is not available.</p>
            <Link
              to="/services"
              className="gradient-bg px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground"
            >
              Back to Services
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return <GoogleAdsSubServiceLayout {...content} />;
};

export default SubServicePage;
