export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Contact', href: '#contact' },
]

export const stats = [
  { value: '5000+', label: 'Students Guided' },
  { value: '98%', label: 'Success Rate' },
  { value: '200+', label: 'Career Transitions' },
]

// icon = lucide-react icon name
export const reasons = [
  { icon: 'UserCheck', title: 'Personalized Approach', text: 'Guidance tailored to your strengths, background and goals.' },
  { icon: 'Rocket', title: 'Fast Track Growth', text: 'Skip the guesswork with a clear, step-by-step plan.' },
  { icon: 'Target', title: 'Goal Oriented', text: 'Every session moves you toward a concrete milestone.' },
  { icon: 'TrendingUp', title: 'Real Results', text: 'Mentors who have placed students at top companies.' },
]

export const services = [
  { icon: 'Compass', title: 'Career Counseling', text: 'One-on-one sessions to find the right path for you.' },
  { icon: 'Map', title: 'Skill Roadmaps', text: 'Personalized learning plans for your target role.' },
  { icon: 'FileText', title: 'Resume Review', text: 'ATS-friendly resumes that get shortlisted.' },
  { icon: 'MessageSquare', title: 'Interview Prep', text: 'Mock interviews with actionable feedback.' },
  { icon: 'BarChart3', title: 'Industry Insights', text: 'Know what employers want, straight from insiders.' },
  { icon: 'GraduationCap', title: 'Higher Education Guidance', text: 'Choose courses and universities with confidence.' },
]

export const paths = [
  { title: 'Software Engineering', companies: ['Google', 'Microsoft', 'Amazon'] },
  { title: 'Data Science', companies: ['Flipkart', 'Mu Sigma', 'Fractal'] },
  { title: 'UX/UI Design', companies: ['Adobe', 'Swiggy', 'Razorpay'] },
  { title: 'Product Management', companies: ['Google', 'Flipkart', 'Uber'] },
  { title: 'Digital Marketing', companies: ['Ogilvy', 'Nykaa', 'Zomato'] },
  { title: 'Cybersecurity', companies: ['Cisco', 'Palo Alto', 'Deloitte'] },
]

export const plans = [
  { name: 'Basic', price: '₹299', unit: '/session', popular: false,
    features: ['1-on-1 career session', 'Session notes', 'Email support'] },
  { name: 'Standard', price: '₹699', unit: '/session', popular: true,
    features: ['Extended 1-on-1 session', 'Resume review', 'Personal skill roadmap', 'Chat support'] },
  { name: 'Premium', price: '₹1,199', unit: '/month', popular: false,
    features: ['Unlimited mentor chat', 'Weekly sessions', 'Mock interviews', 'Priority support'] },
]

export const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer', company: 'Google', quote: 'The roadmap and mock interviews got me my offer in three months.' },
  { name: 'Rahul Verma', role: 'Cloud Engineer', company: 'Microsoft', quote: 'My mentor knew exactly which gaps to fix. Worth every rupee.' },
  { name: 'Ananya Iyer', role: 'Data Analyst', company: 'Amazon', quote: 'I switched from mechanical engineering to data in under a year.' },
  { name: 'Karan Mehta', role: 'Product Manager', company: 'Flipkart', quote: 'Resume review alone doubled my interview calls.' },
]
