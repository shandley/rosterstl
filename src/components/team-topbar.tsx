export function TeamTopbar({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-border bg-card px-7">
      <h1 className="font-heading text-[22px] font-bold">{title}</h1>
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
  );
}
