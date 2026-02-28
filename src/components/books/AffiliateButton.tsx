interface AffiliateButtonProps {
  href: string;
  store: "Amazon";
  price: number | null;
}

export default function AffiliateButton({ href, store, price }: AffiliateButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-amber-500 hover:bg-amber-600 text-white"
    >
      <span>{store}</span>
      {price && (
        <span className="font-bold">
          &#8377;{price.toLocaleString("en-IN")}
        </span>
      )}
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      <span className="text-[10px] opacity-75">(affiliate link)</span>
    </a>
  );
}
