import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlineDevicePhoneMobile,
  HiOutlineGlobeAlt,
  HiOutlineRectangleGroup,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineArrowsPointingOut,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineUserGroup,
  HiOutlineWindow,
} from 'react-icons/hi2'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Projects from '../components/Projects'
import LogoCarousel from '../components/LogoCarousel'
import FaqAccordion from '../components/FaqAccordion'
import TallyLink from '../components/TallyLink'

const PAGE_TITLE = 'Work With Me | Chukwu Patrick Ifeanyi'
const PAGE_DESCRIPTION =
  'Work with Patrick Chukwu to build modern websites, web applications, and custom software. Share your project idea through a short discovery form to get started.'

const services = [
  {
    title: 'Websites & Landing Pages',
    description:
      'Professional, responsive websites that communicate your brand and convert visitors into customers.',
    icon: HiOutlineGlobeAlt,
  },
  {
    title: 'Web Applications',
    description:
      'Interactive, scalable web apps designed around your users, workflows, and business goals.',
    icon: HiOutlineWindow,
  },
  {
    title: 'Mobile Applications',
    description:
      'Modern mobile experiences that help you reach users on the devices they use every day.',
    icon: HiOutlineDevicePhoneMobile,
  },
  {
    title: 'SaaS & Custom Software',
    description:
      'Purpose-built software that streamlines operations, solves unique problems, and supports business growth.',
    icon: HiOutlineCog6Tooth,
  },
  {
    title: 'E-commerce & Digital Platforms',
    description:
      'Online stores and digital platforms with the functionality your customers and business need.',
    icon: HiOutlineShoppingBag,
  },
  {
    title: 'AI-Powered Solutions',
    description:
      'Intelligent features and automation that improve productivity and enhance digital experiences.',
    icon: HiOutlineSparkles,
  },
]

const reasons = [
  {
    title: 'Clarity before code',
    description:
      'I start by understanding your goals, audience, and constraints so the product we build is aligned with what you actually need.',
    icon: HiOutlineChatBubbleLeftRight,
  },
  {
    title: 'Thoughtful, user-focused work',
    description:
      'Every project is shaped around exceptional user experience, seamless functionality, and solid performance.',
    icon: HiOutlineRectangleGroup,
  },
  {
    title: 'Responsive by default',
    description:
      'Your product should feel considered on desktop, tablet, and mobile — not adapted as an afterthought.',
    icon: HiOutlineDevicePhoneMobile,
  },
  {
    title: 'Clear communication',
    description:
      'You will know where the project stands. I keep collaboration close and communication straightforward throughout the work.',
    icon: HiOutlineChatBubbleBottomCenterText,
  },
  {
    title: 'Built to last',
    description:
      'I care about solutions that are maintainable and able to grow with your business, not just look good on launch day.',
    icon: HiOutlineArrowsPointingOut,
  },
  {
    title: 'A collaborative process',
    description:
      'I work closely with clients to understand unique requirements and bring care, creativity, and attention to detail to the build.',
    icon: HiOutlineUserGroup,
  },
]

const steps = [
  {
    number: '01',
    title: 'Discover',
    description: 'We discuss your idea, goals, and requirements.',
  },
  {
    number: '02',
    title: 'Plan',
    description: 'We define the scope, features, priorities, and project direction.',
  },
  {
    number: '03',
    title: 'Build',
    description: 'I design and develop your product with regular communication.',
  },
  {
    number: '04',
    title: 'Launch',
    description: 'We refine, test, and prepare your product for launch.',
  },
]

const faqs = [
  {
    question: 'What types of projects do you work on?',
    answer:
      'I build websites, landing pages, web applications, e-commerce experiences, and custom software. My portfolio includes work across education, healthcare, fintech, events, and HR. If you have an idea that needs a thoughtful digital product, I would like to hear about it.',
  },
  {
    question: 'Do I need to have a complete idea before contacting you?',
    answer:
      'No. You can reach out with a fully defined product or just a starting idea. The project discovery form is there so you can describe what you want in your own words — even if the details are still taking shape.',
  },
  {
    question: 'Can you help me decide which features to build first?',
    answer:
      'Yes. During discovery and planning, we can talk through your goals and prioritize the features that matter most so we start with a focused, useful first version.',
  },
  {
    question: 'How do you determine project pricing?',
    answer:
      'Pricing depends on the project’s scope, complexity, features, design requirements, integrations, and other relevant needs. Sharing your project details through the discovery form helps me understand the work involved and prepare a more accurate estimate.',
  },
  {
    question: 'Can you work with an existing design or Figma file?',
    answer:
      'Yes. If you already have a design, Figma file, or a clear visual direction, I can build from that. If you do not, we can still start from your goals and shape the product together.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Open the project discovery form, tell me what you want to build, and share any goals, features, or constraints you already have. I will review your submission and follow up to discuss next steps.',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

const WorkWithMe = () => {
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

      <main>
        <section className="px-4 pt-8 pb-12 md:pt-14 md:pb-16 w-[98%] max-w-[780px] mx-auto text-left">
      
          <h1 className="text-secondary text-3xl md:text-5xl font-bold leading-tight">
            Have an Idea? Let&apos;s Build Something Great.
          </h1>
          <p className="text-primary text-base md:text-xl mt-5 leading-relaxed max-w-[680px]">
            I help businesses, startups, and ambitious individuals turn ideas into modern,
            high-performing websites, web applications, and custom software that solve real
            problems and create lasting value.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 mt-8">
            <TallyLink className="text-center w-full sm:w-fit">Start Your Project</TallyLink>
            <a
              href="#selected-work"
              className="text-white bg-bcolor px-5 py-2 w-full sm:w-fit text-center font-medium rounded-md border border-black hover:bg-white hover:text-bcolor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
            >
              Explore My Work
            </a>
          </div>
        </section>

        <section aria-label="Selected project brands" className="pb-4">
          <LogoCarousel />
        </section>

        <section
          aria-labelledby="services-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[960px] mx-auto">
            <motion.div {...fadeUp} className="max-w-[700px] mx-auto mb-10 text-center">
              <h2 id="services-heading" className="text-3xl text-secondary font-bold">
                What I Can Build
              </h2>
              <p className="text-primary text-base md:text-lg mt-3 leading-relaxed">
                From a focused landing page to a full product, I help you ship digital
                experiences that are clear, useful, and ready for real users.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => {
                const Icon = service.icon
                return (
                  <motion.article
                    key={service.title}
                    {...fadeUp}
                    className="flex flex-col gap-3 border border-bcolor rounded-xl p-5 bg-grey/30 hover:border-silver transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center size-10 rounded-full bg-primary text-black">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <h3 className="text-secondary text-lg font-semibold">{service.title}</h3>
                    </div>
                    <p className="text-primary text-sm md:text-base leading-relaxed">
                      {service.description}
                    </p>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        <section aria-labelledby="why-heading" className="px-4 py-14 md:py-20">
          <div className="w-[98%] max-w-[960px] mx-auto">
            <motion.div {...fadeUp} className="max-w-[700px] mx-auto mb-10 text-center">
              <h2 id="why-heading" className="text-3xl text-secondary font-bold">
                Why Work With Me?
              </h2>
              <p className="text-primary text-base md:text-lg mt-3 leading-relaxed">
                I am a software engineer who collaborates closely with clients to turn ideas
                into products with strong user experiences and reliable functionality.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reasons.map((reason) => {
                const Icon = reason.icon
                return (
                  <motion.article
                    key={reason.title}
                    {...fadeUp}
                    className="flex gap-4 border border-bcolor rounded-xl p-5"
                  >
                    <span className="flex items-center justify-center size-10 shrink-0 rounded-full bg-bcolor text-secondary">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-secondary text-lg font-semibold">{reason.title}</h3>
                      <p className="text-primary text-sm md:text-base mt-2 leading-relaxed">
                        {reason.description}
                      </p>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="approach-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[960px] mx-auto">
            <motion.div {...fadeUp} className="max-w-[700px] mx-auto mb-10 text-center">
              <h2 id="approach-heading" className="text-3xl text-secondary font-bold">
                My Approach
              </h2>
              <p className="text-primary text-base md:text-lg mt-3 leading-relaxed">
                A simple process designed to keep the work focused and the collaboration clear.
              </p>
            </motion.div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step) => (
                <motion.li
                  key={step.number}
                  {...fadeUp}
                  className="border border-bcolor rounded-xl p-5 bg-grey/30"
                >
                  <p className="text-primary text-sm font-medium tracking-widest">{step.number}</p>
                  <h3 className="text-secondary text-xl font-bold mt-2">{step.title}</h3>
                  <p className="text-primary text-sm md:text-base mt-2 leading-relaxed">
                    {step.description}
                  </p>
                </motion.li>
              ))}
            </ol>
            <div className="flex justify-center mt-10">
              <TallyLink>Start Your Project</TallyLink>
            </div>
          </div>
        </section>

        <section
          id="selected-work"
          aria-labelledby="work-heading"
          className="px-2 py-14 md:py-20 border-t border-bcolor scroll-mt-24"
        >
          <div className="w-[98%] max-w-[750px] mx-auto">
            <motion.div {...fadeUp} className="text-center mb-2">
              <h2 id="work-heading" className="text-3xl text-secondary font-bold px-4">
                Selected Work
              </h2>
              <p className="text-primary text-base md:text-lg mt-3 px-4 leading-relaxed">
                A few projects that show the kind of websites and applications I build.
              </p>
            </motion.div>
            <Projects limit={4} />
            <div className="flex justify-center">
              <Link
                to="/portfolio"
                className="text-white bg-bcolor px-5 py-2 w-fit font-medium rounded-md border border-black hover:bg-white hover:text-bcolor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
              >
                View full portfolio
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="discovery-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div
            {...fadeUp}
            className="w-[98%] max-w-[700px] mx-auto border border-bcolor rounded-xl px-5 py-10 md:px-10 text-center"
          >
            <h2 id="discovery-heading" className="text-3xl text-secondary font-bold">
              Let&apos;s Talk About Your Project
            </h2>
            <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
              Whether you have a fully defined product or just an idea, I&apos;d love to learn
              more. Share your vision, the features you need, and your goals through my project
              discovery form. This helps me understand your requirements and prepare a more
              accurate project estimate.
            </p>
            <div className="flex justify-center mt-8">
              <TallyLink>Tell Me About Your Project</TallyLink>
            </div>
            <p className="text-primary text-sm mt-4">
              No technical expertise required. Just tell me what you want to build in your own
              words.
            </p>
          </motion.div>
        </section>

        <section aria-labelledby="faq-heading" className="px-4 py-14 md:py-20 border-t border-bcolor">
          <div className="w-[98%] max-w-[700px] mx-auto">
            <motion.div {...fadeUp} className="text-center mb-8">
              <h2 id="faq-heading" className="text-3xl text-secondary font-bold">
                Frequently Asked Questions
              </h2>
            </motion.div>
            <FaqAccordion items={faqs} />
          </div>
        </section>

        <section
          aria-labelledby="final-cta-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...fadeUp} className="w-[98%] max-w-[700px] mx-auto text-center">
            <h2 id="final-cta-heading" className="text-3xl md:text-4xl text-secondary font-bold">
              Ready to Bring Your Idea to Life?
            </h2>
            <p className="text-primary text-base md:text-xl mt-4 leading-relaxed">
              Let&apos;s turn your vision into a digital product that works for you and your
              users.
            </p>
            <div className="flex justify-center mt-8">
              <TallyLink>Start Your Project</TallyLink>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default WorkWithMe
