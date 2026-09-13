import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
} from 'react-icons/hi2'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { WHATSAPP_URL } from '../constants/contact'

const PAGE_TITLE = 'Project Submitted | Chukwu Patrick Ifeanyi'
const PAGE_DESCRIPTION =
  'Thank you for sharing your project. Your brief has been submitted, and the next step is a careful review of your goals and requirements.'

const nextSteps = [
  {
    number: '01',
    title: 'Review',
    description: "I'll review your project brief and understand your goals.",
    icon: HiOutlineDocumentText,
  },
  {
    number: '02',
    title: 'Discuss',
    description: "If needed, we'll clarify requirements and discuss the best approach.",
    icon: HiOutlineChatBubbleLeftRight,
  },
  {
    number: '03',
    title: 'Plan & Quote',
    description: "We'll discuss the project scope, development approach, and quotation.",
    icon: HiOutlineClipboardDocumentList,
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

const ProjectSubmitted = () => {
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
        <section className="px-4 pt-10 pb-12 md:pt-16 md:pb-16 w-[98%] max-w-[780px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-auto mb-6 flex size-16 md:size-20 items-center justify-center rounded-full bg-primary text-black"
          >
            <HiOutlineCheckCircle className="size-10 md:size-12" aria-hidden="true" />
            <span className="sr-only">Submission successful</span>
          </motion.div>
  
          <p className="text-primary text-base md:text-xl mt-5 leading-relaxed max-w-[640px] mx-auto">
            Your project brief has been successfully submitted. I appreciate you taking the time
            to share your idea with me.
          </p>
 
        </section>

        <section
          aria-labelledby="next-steps-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[960px] mx-auto">
            <motion.div {...fadeUp} className="max-w-[700px] mx-auto mb-10 text-center">
              <h2 id="next-steps-heading" className="text-3xl text-secondary font-bold">
                What Happens Next?
              </h2>
            </motion.div>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {nextSteps.map((step) => {
                const Icon = step.icon
                return (
                  <motion.li
                    key={step.number}
                    {...fadeUp}
                    className="border border-bcolor rounded-xl p-5 bg-grey/30 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center size-10 shrink-0 rounded-full bg-primary text-black">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <p className="text-primary text-sm font-medium tracking-widest">
                        {step.number}
                      </p>
                    </div>
                    <h3 className="text-secondary text-xl font-bold mt-4">{step.title}</h3>
                    <p className="text-primary text-sm md:text-base mt-2 leading-relaxed">
                      {step.description}
                    </p>
                  </motion.li>
                )
              })}
            </ol>
          </div>
        </section>

        <section
          aria-labelledby="contact-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div
            {...fadeUp}
            className="w-[98%] max-w-[700px] mx-auto border border-bcolor rounded-xl px-5 py-10 md:px-10 text-center"
          >
            <h2 id="contact-heading" className="text-3xl text-secondary font-bold">
              Have Questions or Want to Discuss Your Idea?
            </h2>
            <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
              You can reach out directly if you&apos;d like to share more details or discuss
              your project while I review your submission.
            </p>
            <div className="flex justify-center mt-8">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-primary text-black py-2 px-5 w-full sm:w-fit font-medium rounded-md hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
              >
                <FaWhatsapp aria-hidden="true" className="size-5" />
                Chat with Me on WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </motion.div>
        </section>

        <section
          aria-labelledby="return-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...fadeUp} className="w-[98%] max-w-[700px] mx-auto text-center">
            <h2 id="return-heading" className="sr-only">
              Continue exploring
            </h2>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-4">
              <Link
                to="/"
                className="bg-primary text-black py-2 px-5 w-full sm:w-fit text-center font-medium rounded-md hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
              >
                Back to My Portfolio
              </Link>
              <Link
                to="/portfolio"
                className="text-white bg-bcolor px-5 py-2 w-full sm:w-fit text-center font-medium rounded-md border border-black hover:bg-white hover:text-bcolor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand"
              >
                Explore My Work
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ProjectSubmitted
