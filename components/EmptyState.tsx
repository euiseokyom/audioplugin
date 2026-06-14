import Link from "next/link";

interface Props {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon = "🔍",
  title,
  description,
  actionLabel,
  actionHref,
}: Props) {
  return (
    <div className="text-center py-16 px-4">
      <p className="text-4xl mb-4" aria-hidden>
        {icon}
      </p>
      <h2 className="text-lg font-semibold text-base-content">{title}</h2>
      {description && (
        <p className="text-base-content/60 text-sm mt-2 max-w-md mx-auto">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary btn-sm mt-6">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
