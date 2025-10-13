import { currentVersion } from "@/lib/versionInfo";

export default function Footer() {
  if (!currentVersion) {
    return null;
  }

  const { version, date, description, changes } = currentVersion;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:text-sm">
        <div className="space-y-1">
          <div className="font-medium text-slate-700 dark:text-slate-200">
            Versión {version}
            {date ? <span className="text-muted-foreground"> · {date}</span> : null}
          </div>
          {description ? <p className="max-w-xl leading-snug">{description}</p> : null}
        </div>
      </div>
    </footer>
  );
}
