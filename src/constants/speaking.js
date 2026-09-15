import portrait from '../assets/Patrick.png'
import patrick2 from '../assets/speaking/patrick-chukwu-2.jpeg'
import patrick3 from '../assets/speaking/patrick3.jpeg'

export const SPEAKING_MAIL =
  'mailto:chukwupatrickify@gmail.com?subject=Speaking%20invitation'
export const CONTACT_MAIL = 'mailto:chukwupatrickify@gmail.com'
export const SPEAKING_EMAIL = 'chukwupatrickify@gmail.com'

export const PAGE_TITLE =
  'Patrick Chukwu | Speaker — Technology, AI & Education'
export const PAGE_DESCRIPTION =
  'Invite Patrick Chukwu (Chukwu Patrick Ifeanyi), a software engineer, product builder and EdTech founder, to speak on AI, education, product building and the future of work in Africa.'

export const ONE_LINER =
  'Patrick Chukwu is a Software Engineer working at the intersection of tech, education and social impact'

export const SHORT_BIO =
  'Chukwu Patrick Ifeanyi is a software engineer, product builder, and Co-founder & CEO of Biuda, an EdTech company helping children and teenagers develop the skills to become the next generation of technology innovators. His work sits at the intersection of technology, education and social impact, with a focus on building useful digital products and creating opportunities for young people. Beyond software engineering and entrepreneurship, Patrick is involved in youth development, education advocacy, mentorship and social-impact initiatives. He speaks on technology, AI, education, entrepreneurship and the future of work, particularly from an African perspective.'

export const FULL_BIO = `Patrick Chukwu is a software engineer and product builder. He turns ideas and complex problems into simple, useful and scalable digital experiences. His work sits at the intersection of software, education and social impact.

He is the Co-founder and CEO of Biuda, an EdTech company helping children and teenagers develop the technology skills they need to become the next generation of innovators. Biuda does this through training, mentorship and opportunities. Patrick's role spans software engineering, product development, education, partnerships, community building and program development.

He also works with startups, organizations, schools and social-impact initiatives to build digital products, lead programs and use technology to solve real-world problems. That work has included products across education, healthcare, fintech, events and HR.

Patrick's wider work includes youth development, education advocacy, mentorship, leadership, speaking and panel discussions, startup and product judging, community initiatives and climate-related social-impact projects. He believes technology is most valuable when it creates opportunities for people.

He speaks about AI and the future of work, AI and education, building technology products, the future of education in Africa, technology and youth development, entrepreneurship, and preparing young Africans for the digital economy. Those talks come from the practice of writing software, shipping products and building an education company — not from speaking as a profession.

Patrick is based in Nigeria and works across technology and education in Africa.`

/*
  To add an approved speaker photo:
  1. Place the file in src/assets/speaking/ using the filename below.
  2. Import it at the top of this file.
  3. Set `src` to that import and `available` to true.
*/
export const speakerPhotos = [
  {
    id: 'patrick-chukwu-speaker-01',
    src: portrait,
    filename: 'patrick-chukwu-speaker-01.png',
    alt: 'Patrick Chukwu professional headshot, wearing glasses and a navy suit',
    label: 'Headshot',
    available: true,
  },
  {
    id: 'patrick-chukwu-speaker-02',
    src: patrick2,
    filename: 'patrick-chukwu-2.jpeg',
    alt: 'Approved speaker photo of Patrick Chukwu ',
    label: 'Portrait',
    available: true,
  },
  {
    id: 'patrick-chukwu-speaker-03',
    src: patrick3,
    filename: 'patrick-3.jpg',
    alt: 'Approved speaker photo of Patrick Chukwu',
    label: 'Alternate',
    available: true,
  },
]

export const speakingTopics = [
  {
    title: 'AI & the Future of Work',
    copy: 'What AI is changing about work — and what people still need to learn so they can participate, not watch from the sidelines.',
  },
  {
    title: 'AI & Education',
    copy: 'Where AI actually helps learning, and where it gets in the way. Drawn from building education products and working with young people.',
  },
  {
    title: 'Building Technology Products',
    copy: 'How to take a messy idea and turn it into something people can use — for founders, students and teams who want more clarity before they build.',
  },
  {
    title: 'Software Engineering & Product Development',
    copy: 'The craft of shipping useful software: the trade-offs, the product thinking next to the code, and what holds up after launch.',
  },
  {
    title: 'The Future of Education in Africa',
    copy: 'Skills, mentorship and real opportunities matter as much as tools. What that means for how we teach and who gets to build.',
  },
  {
    title: 'Technology & Youth Development',
    copy: 'How to help young people become builders of technology, not only consumers of it.',
  },
  {
    title: 'Entrepreneurship & Innovation',
    copy: 'Building a company while building the product — the unglamorous middle of turning an idea into something that serves people.',
  },
  {
    title: 'Preparing Young Africans for the Digital Economy',
    copy: 'Practical paths into technology: the skills, the mindset, and the first opportunities that make the rest possible.',
  },
]

export const audiences = [
  'Students & young people',
  'Founders & entrepreneurs',
  'Software engineers & developers',
  'Educators',
  'Business & technology leaders',
  'Social-impact organizations',
]

export const formats = [
  {
    title: 'Keynote',
    copy: 'A focused talk on technology, AI, education or the future of work.',
  },
  {
    title: 'Panel discussion',
    copy: 'A conversation alongside other practitioners, educators or founders.',
  },
  {
    title: 'Fireside chat',
    copy: 'A hosted conversation — useful when the audience wants questions, not a lecture.',
  },
  {
    title: 'Workshop',
    copy: 'A working session on product building, or on helping young people enter technology.',
  },
  {
    title: 'Masterclass',
    copy: 'A longer, more practical session for students, early-career builders or founders.',
  },
  {
    title: 'Career / university talk',
    copy: 'For schools and campuses: paths into software, product and entrepreneurship.',
  },
  {
    title: 'Founder session',
    copy: 'For startup communities: building products, and building the company around them.',
  },
]

export const credentials = [
  {
    area: 'Entrepreneurship',
    title: 'Co-founder & CEO, Biuda',
    copy: 'An EdTech company helping children and teenagers develop technology skills through training, mentorship and opportunities.',
  },
  {
    area: 'Software engineering',
    title: 'Products across industries',
    copy: 'Designed and developed digital products for organizations in education, healthcare, fintech, events and HR.',
  },
  {
    area: 'Speaking & writing',
    title: 'Talks and writing on technology',
    copy: 'Shared talks and writing on technology, education and social impact, including a beginner-friendly introduction to blockchain.',
    href: 'https://speakerdeck.com/thepatrickchukwu/a-beginners-guide-to-understanding-blockchain-technology',
    hrefLabel: 'View blockchain talk',
  },
  {
    area: 'Education & youth',
    title: 'Programs, mentorship and advocacy',
    copy: 'Worked with schools and education-focused teams, and mentored young people learning to build.',
  },
  {
    area: 'Leadership',
    title: 'Teams, programs and judging',
    copy: 'Led teams and programs, and taken part in speaking, panel discussions and startup/product judging.',
  },
  {
    area: 'Social impact',
    title: 'Community and climate-related work',
    copy: 'Contributed to community initiatives and climate-related social-impact projects alongside the product work.',
  },
]

export const buildSpeakerKitText = () => {
  const topicList = speakingTopics.map((topic) => `- ${topic.title}`).join('\n')

  return [
    'Patrick Chukwu — Speaker',
    'Software Engineer, Product Builder & EdTech Founder',
    '',
    'ONE-LINER',
    ONE_LINER,
    '',
    'SHORT BIO',
    SHORT_BIO,
    '',
    'FULL BIO',
    FULL_BIO,
    '',
    'SPEAKING TOPICS',
    topicList,
    '',
    'CONTACT',
    SPEAKING_EMAIL,
    'https://www.linkedin.com/in/patrick-chukwu/',
    'https://www.biudahq.com',
    '',
    'Approved speaker photos are available on the speaking page.',
    'Use the download buttons there for print-ready files.',
  ].join('\n')
}
