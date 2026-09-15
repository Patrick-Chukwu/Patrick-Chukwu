import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import portrait from '../assets/Patrick.png'

const PAGE_TITLE = 'About Patrick Chukwu | Software Engineer & Product Builder'
const PAGE_DESCRIPTION =
  'Patrick Chukwu (Chukwu Patrick Ifeanyi) is a software engineer and product builder working at the intersection of technology, AI, education, and social impact in Africa. Co-founder and CEO of Biuda.'

const btnPrimary =
  'bg-primary text-black py-2.5 px-5 w-full sm:w-fit text-center font-medium rounded-md hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors'
const btnSecondary =
  'text-white bg-bcolor px-5 py-2.5 w-full sm:w-fit text-center font-medium rounded-md border border-black hover:bg-white hover:text-bcolor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors'
const textLink =
  'font-medium text-secondary underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand rounded-sm'

const focusAreas = [
  {
    title: 'Software & Digital Products',
    copy: 'I design and develop websites, web applications, and digital platforms for startups and organizations. My work has included products across education, healthcare, fintech, events, and HR.',
  },
  {
    title: 'AI & Emerging Technology',
    copy: 'I use AI as both a product capability and a way of working — integrating intelligent features where they help, and building faster without losing care for the people who use what I ship.',
  },
  {
    title: 'Education Technology',
    copy: 'I build for learning. That includes Biuda and other education-focused products that help people develop skills and find a clearer path into technology.',
  },
  {
    title: 'Social Impact',
    copy: 'I work with organizations and initiatives that use technology to solve real problems — not as a slogan, but as a way to create opportunities for people.',
  },
]

const beyondCode = [
  {
    title: 'Education',
    copy: 'I care about making technology learning more accessible — through products, programs, and advocacy that help people grow their skills.',
  },
  {
    title: 'Youth development',
    copy: 'I help young people learn to build, not only consume technology. Skills, confidence, and a first real opportunity can change a trajectory.',
  },
  {
    title: 'Leadership',
    copy: 'I have led teams and programs, and I take responsibility for turning ideas into things that ship and serve people.',
  },
  {
    title: 'Mentorship',
    copy: 'I mentor people who are learning to build. Access to guidance often determines what someone is willing to attempt.',
  },
  {
    title: 'Social impact',
    copy: 'I contribute to community initiatives and climate-related social-impact work, alongside projects that use technology for something larger than a feature list.',
  },
  {
    title: 'Speaking',
    copy: 'I speak and join panel discussions about technology, education, and building products that create opportunity.',
  },
]

const speakingTopics = [
  'AI and the Future of Work',
  'AI and Education',
  'Building Technology Products',
  'The Future of Education in Africa',
  'Technology and Youth Development',
  'Entrepreneurship and Product Building',
  'Preparing Young Africans for the Digital Economy',
]

const skillGroups = [
  {
    title: 'Frontend',
    items: ['React', 'Next.js', 'Vue', 'JavaScript', 'TypeScript'],
  },
  {
    title: 'Backend',
    items: ['Node.js', 'Python', 'APIs'],
  },
  {
    title: 'Data',
    items: ['MySQL', 'MongoDB'],
  },
  {
    title: 'AI',
    items: ['AI-powered products', 'AI integration', 'AI-assisted development'],
  },
  {
    title: 'Web platforms',
    items: ['WordPress', 'Webflow'],
  },
]

const highlights = [
  {
    area: 'Founded',
    title: 'Co-founded Biuda',
    copy: 'Building an EdTech company that helps children and teenagers develop technology skills through training, mentorship, and opportunities.',
  },
  {
    area: 'Software engineering',
    title: 'Shipped products across industries',
    copy: 'Designed and developed digital products for organizations in education, healthcare, fintech, events, and HR.',
  },
  {
    area: 'Education',
    title: 'Built with schools and learning organizations',
    copy: 'Worked with education-focused teams on products and programs that make technology more accessible to learners.',
  },
  {
    area: 'Leadership',
    title: 'Led teams and programs',
    copy: 'Taken products and education initiatives from idea to delivery — across engineering, product, partnerships, and community.',
  },
  {
    area: 'Speaking',
    title: 'Talks and writing on technology',
    copy: 'Shared talks and writing on technology, education, and social impact, including a beginner-friendly introduction to blockchain.',
  },
  {
    area: 'Youth development',
    title: 'Mentored young builders',
    copy: 'Supported young people as they learn to build and participate in the digital economy.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Chukwu Patrick Ifeanyi',
  alternateName: ['Patrick Chukwu', 'Patrick'],
  jobTitle: 'Software Engineer & Product Builder',
  description: PAGE_DESCRIPTION,
  email: 'mailto:chukwupatrickify@gmail.com',
  nationality: 'Nigerian',
  sameAs: [
    'https://www.linkedin.com/in/patrick-chukwu/',
    'https://x.com/PattyFean',
    'https://github.com/Patrick-Chukwu',
    'https://www.biudahq.com',
  ],
  knowsAbout: [
    'Software Engineering',
    'Product Development',
    'Artificial Intelligence',
    'EdTech',
    'Education',
    'Social Impact',
    'Youth Development',
  ],
}

const About = () => {
  const reduceMotion = useReducedMotion()
  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' },
  }

  useEffect(() => {
    const previousTitle = document.title
    const meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content')

    document.title = PAGE_TITLE
    meta?.setAttribute('content', PAGE_DESCRIPTION)

    return () => {
      document.title = previousTitle
      if (meta && previousDescription) {
        meta.setAttribute('content', previousDescription)
      }
    }
  }, [])

  return (
    <div className="flex flex-col mt-24">
      <Navbar />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <main>
        <section className="px-4 pt-8 pb-14 md:pt-16 md:pb-20 w-[98%] max-w-[880px] mx-auto">
          <div className="flex items-center gap-4 md:hidden mb-6">
            <img
              src={portrait}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full object-cover object-top bg-pic ring-1 ring-bcolor shrink-0"
            />
            <p className="text-primary text-sm tracking-wide">
              Chukwu Patrick Ifeanyi
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-12">
            <div className="min-w-0 flex-1">
              <p className="hidden md:block text-primary text-base tracking-wide">
                Chukwu Patrick Ifeanyi
              </p>
              <h1 className="text-secondary text-[2rem] leading-[1.15] sm:text-5xl md:text-6xl font-bold md:mt-3 text-balance">
                <span className="block">Software Engineer.</span>
                <span className="block">Product Builder.</span>
                <span className="block text-primary font-semibold text-[1.65rem] sm:text-3xl md:text-4xl mt-3 md:mt-4 text-pretty">
                  Building technology that creates opportunities.
                </span>
              </h1>
            </div>
            <img
              src={portrait}
              alt="Portrait of Patrick Chukwu"
              width={160}
              height={160}
              className="hidden md:block size-40 rounded-full object-cover object-top bg-pic ring-1 ring-bcolor shrink-0"
            />
          </div>

          <p className="text-primary text-base md:text-xl mt-8 leading-relaxed max-w-[680px]">
            I am Patrick, a software engineer and product builder. My work sits at
            the intersection of software, education, and social impact — turning
            ideas and complex problems into simple, useful, and scalable digital
            experiences.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-8">
            <Link to="/portfolio" className={btnPrimary}>
              View my work
            </Link>
            <Link to="/work-with-me" className={btnSecondary}>
              Let&apos;s connect
            </Link>
          </div>
          <p className="mt-5">
            <Link to="/speaking" className={textLink}>
              Looking for a speaker? →
            </Link>
          </p>
        </section>

        <section
          aria-labelledby="story-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <h2
              id="story-heading"
              className="text-3xl md:text-4xl text-secondary font-bold"
            >
              My story
            </h2>
            <div className="mt-6 space-y-5 text-primary text-base md:text-lg leading-relaxed">
              <p>
                I enjoy making complicated things feel simple. Software engineering
                became a major part of my work because it is how I take an idea —
                or a messy problem — and turn it into something people can use.
              </p>
              <p>
                Over time, education and social impact became just as important.
                Technology is interesting on its own, but it matters most when it
                opens a door: a skill, a product, a chance to participate in the
                digital economy.
              </p>
              <p>
                Those interests led me to build products such as Biuda, and to
                work with startups, organizations, schools, and social-impact
                initiatives. I still write code. I also shape products, lead
                programs, and think about the people on the other side of the
                work.
              </p>
            </div>
          </motion.div>
        </section>

        <section
          aria-labelledby="build-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[880px] mx-auto">
            <motion.div {...reveal} className="max-w-[720px]">
              <h2
                id="build-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                What I build
              </h2>
              <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
                I work beyond a single layer of the stack. The through-line is
                products that are useful, clear, and built for real people.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mt-12">
              {focusAreas.map((area, index) => (
                <motion.article key={area.title} {...reveal}>
                  <p className="text-primary text-sm tracking-[0.18em] uppercase">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-secondary text-xl md:text-2xl font-semibold mt-2">
                    {area.title}
                  </h3>
                  <p className="text-primary text-sm md:text-base mt-3 leading-relaxed">
                    {area.copy}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="biuda-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div
            {...reveal}
            className="w-[98%] max-w-[720px] mx-auto"
          >
            <p className="text-primary text-sm tracking-[0.18em] uppercase">
              Currently building
            </p>
            <h2
              id="biuda-heading"
              className="text-3xl md:text-4xl text-secondary font-bold mt-3"
            >
              Biuda
            </h2>
            <p className="text-secondary text-lg md:text-xl font-medium mt-3">
              Co-founder &amp; CEO
            </p>
            <div className="mt-6 space-y-5 text-primary text-base md:text-lg leading-relaxed">
              <p>
                Biuda is an EdTech company helping children and teenagers develop
                the technology skills they need to become the next generation of
                innovators — through training, mentorship, and opportunities.
              </p>
              <p>
                Too many young people grow up around technology without a clear
                path to build with it. Biuda exists to close that gap: to give
                children and teenagers the skills, guidance, and chances they
                need to participate in the digital economy.
              </p>
              <p>
                As Co-founder and CEO, I work across software engineering,
                product development, education, partnerships, community building,
                and program development. The longer view is a generation of
                young people who can create with technology, not only consume it.
              </p>
            </div>
            <a
              href="https://www.biudahq.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnPrimary} inline-flex mt-8`}
            >
              Learn more about Biuda
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </motion.div>
        </section>

        <section
          aria-labelledby="beyond-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[880px] mx-auto">
            <motion.div {...reveal} className="max-w-[720px]">
              <h2
                id="beyond-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                Beyond code
              </h2>
              <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
                Engineering is one part of the work. I also contribute to
                initiatives that help young people learn, build, and take part in
                the digital economy.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 mt-12">
              {beyondCode.map((item) => (
                <motion.article
                  key={item.title}
                  {...reveal}
                  className="border-t border-bcolor pt-5"
                >
                  <h3 className="text-secondary text-lg md:text-xl font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-primary text-sm md:text-base mt-2 leading-relaxed">
                    {item.copy}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="speaking"
          aria-labelledby="speaking-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor scroll-mt-24"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <h2
              id="speaking-heading"
              className="text-3xl md:text-4xl text-secondary font-bold"
            >
              Speaking &amp; thought leadership
            </h2>
            <div className="mt-6 space-y-5 text-primary text-base md:text-lg leading-relaxed">
              <p>
                I speak about technology and the people it is supposed to serve —
                especially where software, education, and opportunity meet.
              </p>
              <p>
                I have given talks and written about technology, education, and
                social impact, including a beginner-friendly introduction to{' '}
                <a
                  href="https://speakerdeck.com/thepatrickchukwu/a-beginners-guide-to-understanding-blockchain-technology"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={textLink}
                >
                  blockchain
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                . I also join conversations on product building, youth
                development, and the future of work.
              </p>
            </div>

            <h3 className="text-secondary text-xl font-semibold mt-10">
              Topics I can speak about
            </h3>
            <ul className="mt-4 flex flex-col gap-2">
              {speakingTopics.map((topic) => (
                <li
                  key={topic}
                  className="text-primary text-base md:text-lg pl-4 border-l border-silver"
                >
                  {topic}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-10">
              <Link to="/speaking" className={btnPrimary}>
                Invite Patrick to speak
              </Link>
              <Link to="/speaking#media-kit" className={btnSecondary}>
                Speaker kit &amp; bios
              </Link>
            </div>
          </motion.div>
        </section>

        <section
          aria-labelledby="skills-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[720px] mx-auto">
            <motion.div {...reveal}>
              <h2
                id="skills-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                Technical expertise
              </h2>
              <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
                I work across the stack, with a focus on thoughtful interfaces
                and products that hold up in the real world.
              </p>
            </motion.div>

            <dl className="mt-10 divide-y divide-bcolor border-y border-bcolor">
              {skillGroups.map((group) => (
                <motion.div
                  key={group.title}
                  {...reveal}
                  className="py-5 md:grid md:grid-cols-[160px_1fr] md:gap-8 md:items-baseline"
                >
                  <dt className="text-secondary font-semibold text-base md:text-lg">
                    {group.title}
                  </dt>
                  <dd className="text-primary text-sm md:text-base mt-2 md:mt-0 leading-relaxed">
                    {group.items.join(' · ')}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </section>

        <section
          aria-labelledby="highlights-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[720px] mx-auto">
            <motion.div {...reveal}>
              <h2
                id="highlights-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                A few things I&apos;ve done
              </h2>
              <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
                Milestones that show the range of the work — not a complete CV.
              </p>
            </motion.div>

            <ol className="relative mt-12 border-l border-bcolor ml-1 md:ml-2">
              {highlights.map((item) => (
                <motion.li
                  key={item.title}
                  {...reveal}
                  className="relative pl-8 md:pl-10 pb-10 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-[-5px] top-1.5 size-2.5 rounded-full bg-primary"
                  />
                  <p className="text-primary text-xs md:text-sm tracking-[0.16em] uppercase">
                    {item.area}
                  </p>
                  <h3 className="text-secondary text-lg md:text-xl font-semibold mt-1">
                    {item.title}
                  </h3>
                  <p className="text-primary text-sm md:text-base mt-2 leading-relaxed">
                    {item.copy}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="beliefs-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <h2
              id="beliefs-heading"
              className="text-3xl md:text-4xl text-secondary font-bold"
            >
              What I believe
            </h2>
            <blockquote className="mt-8 border-l-2 border-primary pl-5 md:pl-7">
              <p className="text-secondary text-xl md:text-3xl font-semibold leading-snug">
                Technology is most valuable when it creates opportunities for
                people.
              </p>
            </blockquote>
            <p className="text-primary text-base md:text-lg mt-6 leading-relaxed">
              That is the standard I try to hold my work to. Build things that
              are useful. Make technology a little more accessible. Give young
              people a clearer path in. Use engineering on problems that are
              worth the time.
            </p>
          </motion.div>
        </section>

        <section
          aria-labelledby="final-cta-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto text-left md:text-center">
            <h2
              id="final-cta-heading"
              className="text-3xl md:text-4xl text-secondary font-bold"
            >
              Let&apos;s build something meaningful.
            </h2>
            <p className="text-primary text-base md:text-xl mt-5 leading-relaxed max-w-[640px] md:mx-auto">
              Whether you want to collaborate on a product, explore a
              partnership, invite me to speak, or simply connect, I would like
              to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center md:justify-center gap-3 sm:gap-4 mt-8">
              <Link to="/work-with-me" className={btnPrimary}>
                Let&apos;s work together
              </Link>
              <Link to="/speaking" className={btnSecondary}>
                Invite me to speak
              </Link>
            </div>
            <p className="mt-6">
              <a href="mailto:chukwupatrickify@gmail.com" className={textLink}>
                chukwupatrickify@gmail.com
              </a>
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default About
