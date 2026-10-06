export type StarterItem = { title: string; detail: string; due_on: string }

export const CAREER_PATHS = ['Software Engineering', 'Data Science', 'UX/UI Design', 'Product Management', 'Digital Marketing', 'Cybersecurity']

const T = (a: string, b: string, c: string, d: string, e: string): [string, string][] => [
  [a, 'Define what you want to learn and by when.'],
  [b, 'Learn by doing; keep it small and finish it.'],
  [c, 'Show your work where recruiters can see it.'],
  [d, 'Talk to people already doing the job.'],
  [e, 'Practise out loud, then apply with confidence.'],
]

const STEPS: Record<string, [string, string][]> = {
  'Software Engineering': T('Master one language and core data structures', 'Build a full-stack project end to end', 'Publish projects on GitHub with a clear README', 'Join a developer community and get a code review', 'Practise coding interviews and apply to roles'),
  'Data Science': T('Learn Python, SQL and statistics basics', 'Complete an end-to-end analysis on a real dataset', 'Publish a notebook portfolio on GitHub or Kaggle', 'Talk to a working data scientist about their day', 'Practise case and SQL interviews, then apply'),
  'UX/UI Design': T('Learn design fundamentals and Figma', 'Design one app flow from research to prototype', 'Publish a case study portfolio', 'Get feedback from a practising designer', 'Practise portfolio walkthroughs and apply'),
  'Product Management': T('Learn product fundamentals and metrics', 'Write a PRD for a product you use', 'Publish a product teardown', 'Interview a product manager about their role', 'Practise product-sense interviews and apply'),
  'Digital Marketing': T('Learn SEO, content and paid-ads basics', 'Run a small campaign and track its results', 'Publish a results-focused marketing portfolio', 'Connect with marketers in your target industry', 'Practise campaign case interviews and apply'),
  Cybersecurity: T('Learn networking and security fundamentals', 'Complete hands-on labs and capture-the-flag challenges', 'Write up your lab findings publicly', 'Join a security community and find a mentor', 'Prepare for a security certification and apply'),
}

const GENERIC = T('Pick your target role and list the skills it needs', 'Build one project that proves a key skill', 'Update your resume and LinkedIn profile', 'Reach out to three people working in the field', 'Practise interviews and apply to roles')

const pad = (n: number) => String(n).padStart(2, '0')

/** 5 starter steps due every 2 weeks from `from` (local dates, YYYY-MM-DD). Unknown path -> generic steps. */
export function starterRoadmap(path: string, from: Date): StarterItem[] {
  const steps = Object.hasOwn(STEPS, path) ? STEPS[path] : GENERIC
  return steps.map(([title, detail], i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 14 * (i + 1))
    return { title, detail, due_on: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
  })
}
