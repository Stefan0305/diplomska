interface PlaceholderPageProps {
  title: string;
  sprint: number;
}

export function PlaceholderPage({ title, sprint }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">Coming in Sprint {sprint}.</p>
    </div>
  );
}
