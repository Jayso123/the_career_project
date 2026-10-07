import { safeUrl, type ResumeData } from '../lib/resumeModel'

const has = (...v: string[]) => v.some((s) => s.trim())
const H = ({ children, side }: { children: React.ReactNode; side?: boolean }) => (
  <h2 className={`font-heading text-[0.8em] font-bold uppercase tracking-wider mb-1.5 pb-0.5 ${side ? 'border-b border-white/40' : 'border-b border-slate-300 text-slate-700'}`}>{children}</h2>
)

function Link({ url }: { url: string }) {
  const href = safeUrl(url)
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{url}</a> : <span>{url}</span>
}

/** Pure render of ResumeData. Empty sections render nothing (no heading, no spacing). All user text is React text. */
export default function ResumePreview({ data }: { data: ResumeData }) {
  const { personal: p } = data
  const exp = data.experience.filter((e) => has(e.role, e.company, e.from, e.to) || e.bullets.length)
  const edu = data.education.filter((e) => has(e.degree, e.school, e.year))
  const proj = data.projects.filter((e) => has(e.name, e.detail))
  const modern = data.template === 'modern'
  const contact = [p.email, p.phone, p.location].filter((s) => s.trim())
  const links = p.links.filter((l) => l.trim())

  const main = (
    <>
      {data.summary && <section className="mb-4"><H>Summary</H><p>{data.summary}</p></section>}
      {exp.length > 0 && (
        <section className="mb-4">
          <H>Experience</H>
          {exp.map((e) => (
            <div key={e.id} className="rs-entry mb-2.5">
              <div className="flex justify-between gap-3 font-semibold">
                <span>{[e.role, e.company].filter(Boolean).join(', ')}</span>
                {has(e.from, e.to) && <span className="shrink-0 font-normal text-slate-600">{[e.from, e.to].filter(Boolean).join(' - ')}</span>}
              </div>
              {e.bullets.length > 0 && <ul className="list-disc pl-5">{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
            </div>
          ))}
        </section>
      )}
      {edu.length > 0 && (
        <section className="mb-4">
          <H>Education</H>
          {edu.map((e) => (
            <div key={e.id} className="rs-entry mb-1.5 flex justify-between gap-3">
              <span><span className="font-semibold">{e.degree}</span>{e.degree && e.school ? ', ' : ''}{e.school}</span>
              {e.year && <span className="shrink-0 text-slate-600">{e.year}</span>}
            </div>
          ))}
        </section>
      )}
      {proj.length > 0 && (
        <section className="mb-4">
          <H>Projects</H>
          {proj.map((e) => (
            <div key={e.id} className="rs-entry mb-1.5"><span className="font-semibold">{e.name}</span>{e.name && e.detail ? ': ' : ''}{e.detail}</div>
          ))}
        </section>
      )}
    </>
  )
  const skills = data.skills.length > 0 && (
    <section className="mb-4">
      <H side={modern}>Skills</H>
      {modern ? <ul>{data.skills.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p>{data.skills.join(' | ')}</p>}
    </section>
  )
  const contactBlock = (contact.length > 0 || links.length > 0) && (
    <section className="mb-4">
      {modern && <H side>Contact</H>}
      <ul className={modern ? '' : 'flex flex-wrap justify-center gap-x-3 text-slate-600'}>
        {contact.map((c, i) => <li key={i}>{c}</li>)}
        {links.map((l, i) => <li key={`l${i}`}><Link url={l} /></li>)}
      </ul>
    </section>
  )

  if (modern) {
    return (
      <div className="resume-sheet grid grid-cols-[32%_1fr]" data-template="modern" aria-label="Resume preview">
        <aside className="rs-side p-5">
          {p.name && <h1 className="font-heading text-[1.6em] font-bold leading-tight mb-4">{p.name}</h1>}
          {contactBlock}
          {skills}
        </aside>
        <div className="p-5">{main}</div>
      </div>
    )
  }
  return (
    <div className="resume-sheet p-8" data-template="classic" aria-label="Resume preview">
      {(p.name || contactBlock) && (
        <header className="mb-4 text-center">
          {p.name && <h1 className="font-heading text-[2em] font-bold leading-tight">{p.name}</h1>}
          {contactBlock}
        </header>
      )}
      {main}
      {skills}
    </div>
  )
}
