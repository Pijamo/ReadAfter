import AffiliateButton from "./AffiliateButton";

interface PriceCompareProps {
  amazonUrl: string;
  flipkartUrl: string;
  amazonPrice: number | null;
  flipkartPrice: number | null;
}

export default function PriceCompare({
  amazonUrl,
  flipkartUrl,
  amazonPrice,
  flipkartPrice,
}: PriceCompareProps) {
  const hasBothPrices = amazonPrice && flipkartPrice;
  const savings = hasBothPrices ? Math.abs(amazonPrice - flipkartPrice) : 0;
  const cheaperStore =
    hasBothPrices && savings > 0
      ? amazonPrice < flipkartPrice
        ? "Amazon"
        : "Flipkart"
      : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <AffiliateButton href={amazonUrl} store="Amazon" price={amazonPrice} />
        <AffiliateButton href={flipkartUrl} store="Flipkart" price={flipkartPrice} />
      </div>
      {cheaperStore && savings >= 10 && (
        <p className="text-xs text-green-700 bg-green-50 inline-block px-2 py-0.5 rounded">
          Save &#8377;{savings.toLocaleString("en-IN")} on {cheaperStore}
        </p>
      )}
    </div>
  );
}
