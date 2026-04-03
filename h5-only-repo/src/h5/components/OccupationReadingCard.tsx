interface OccupationReadingCardProps {
  title: string;
  content: string;
  emptyText: string;
}

export function OccupationReadingCard({ title, content, emptyText }: OccupationReadingCardProps) {
  const text = String(content || "").trim();

  return (
    <article data-h5-numbered-box className="h5-numbered rounded-[28px] border border-white/8 bg-black/10 px-5 py-5">
      <p className="h5-kicker">{title}</p>
      <p className="mt-4 text-sm leading-7 text-white/78">{text || emptyText}</p>
    </article>
  );
}
