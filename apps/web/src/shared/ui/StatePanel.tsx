import { Link } from "react-router-dom";
export function StatePanel({
  title,
  description,
  to = "/hoy",
  action = "Volver a Hoy",
  error = false,
}: {
  title: string;
  description: string;
  to?: string;
  action?: string;
  error?: boolean;
}) {
  return (
    <section className="card empty" role={error ? "alert" : undefined}>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button primary" to={to}>
        {action}
      </Link>
    </section>
  );
}
