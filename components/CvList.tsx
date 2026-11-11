export type CvEntry = { period: string; heading: string; place: string; detail?: string };

export default function CvList({ entries }: { entries: CvEntry[] }) {
  return (
    <ul className="cv-list">
      {entries.map((entry) => (
        <li key={entry.heading + entry.period}>
          <span className="cv-period">{entry.period}</span>
          <div>
            <strong>{entry.heading}</strong>, {entry.place}
            {entry.detail && <div className="cv-detail">{entry.detail}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export const education = (items: { period: string; degree: string; institution: string; detail?: string }[]) =>
  items.map((e) => ({ period: e.period, heading: e.degree, place: e.institution, detail: e.detail }));

export const experience = (items: { period: string; title: string; organization: string; detail?: string }[]) =>
  items.map((e) => ({ period: e.period, heading: e.title, place: e.organization, detail: e.detail }));
