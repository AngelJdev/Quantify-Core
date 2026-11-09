import product from "../../../../../assets/images/productLogo.jpeg";
import productDark from "../../../../../assets/images/brand/product-dark.png";
import enterprise from "../../../../../assets/images/enterpriseLogo.jpeg";
import enterpriseDark from "../../../../../assets/images/brand/enterprise-dark.png";

export function Brand({
  dark,
  enterprise: company = false,
}: {
  dark: boolean;
  enterprise?: boolean;
}) {
  // Encuadre de presentación documentado en generar.py: logos(). Originales intactos.
  return (
    <svg
      className={`official-brand ${company ? "enterprise" : ""}`}
      viewBox={company ? "100 290 1400 650" : "100 350 1400 520"}
      role="img"
      aria-label={company ? "Nexus Core" : "Quantify Core"}
    >
      <image
        href={
          company
            ? dark
              ? enterpriseDark
              : enterprise
            : dark
              ? productDark
              : product
        }
        width="1600"
        height="1194"
      />
    </svg>
  );
}
