type HomeSectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export function HomeSectionHeading({ eyebrow, title, description, centered = false }: HomeSectionHeadingProps) {
  return (
    <div className={centered ? "iv-section-heading text-center" : "iv-section-heading"}>
      <p className="iv-eyebrow">{eyebrow}</p>
      <h2 className="iv-section-title">{title}</h2>
      {description ? (
        <p className={centered ? "iv-section-description mx-auto" : "iv-section-description"}>{description}</p>
      ) : null}
    </div>
  );
}
