import AffiliateButton from "./AffiliateButton";

interface PriceCompareProps {
  amazonUrl: string;
  amazonPrice: number | null;
}

export default function PriceCompare({
  amazonUrl,
  amazonPrice,
}: PriceCompareProps) {
  return (
    <div>
      <AffiliateButton href={amazonUrl} store="Amazon" price={amazonPrice} />
    </div>
  );
}
