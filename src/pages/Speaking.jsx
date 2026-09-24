import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CopyButton from '../components/CopyButton'
import {
  CONTACT_MAIL,
  FULL_BIO,
  ONE_LINER,
  PAGE_DESCRIPTION,
  PAGE_TITLE,
  SHORT_BIO,
  SPEAKING_EMAIL,
  SPEAKING_MAIL,
  audiences,
  buildSpeakerKitText,
  credentials,
  formats,
  speakerPhotos,
  speakingTopics,
} from '../constants/speaking'
import { downloadFromUrl, downloadTextFile } from '../utils/files'

const btnPrimary =
  'bg-primary text-black py-2.5 px-5 w-full sm:w-fit text-center font-medium rounded-md hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors'
const btnSecondary =
  'text-white bg-bcolor px-5 py-2.5 w-full sm:w-fit text-center font-medium rounded-md border border-black hover:bg-white hover:text-bcolor focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors'
const textLink =
  'font-medium text-secondary underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand rounded-sm'

const availablePhotos = speakerPhotos.filter((photo) => photo.available && photo.src)

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Chukwu Patrick Ifeanyi',
  alternateName: ['Patrick Chukwu', 'Patrick Ifeanyi Chukwu', 'Patrick'],
  jobTitle: 'CEO, Biuda',
  description: PAGE_DESCRIPTION,
  email: CONTACT_MAIL,
  nationality: 'Nigerian',
  sameAs: [
    'https://www.linkedin.com/in/patrick-chukwu/',
    'https://x.com/PattyFean',
    'https://github.com/Patrick-Chukwu',
    'https://www.biudahq.com',
  ],
  knowsAbout: [
    'Public Speaking',
    'Artificial Intelligence',
    'Education',
    'EdTech',
    'Software Engineering',
    'Product Development',
    'Future of Work',
    'Youth Development',
  ],
}

const setMetaTag = (attr, key, value) => {
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  let created = false
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
    created = true
  }
  const previous = tag.getAttribute('content')
  tag.setAttribute('content', value)
  return () => {
    if (created) {
      tag.remove()
    } else if (previous != null) {
      tag.setAttribute('content', previous)
    }
  }
}

const downloadSpeakerKit = async () => {
  downloadTextFile(buildSpeakerKitText(), 'patrick-chukwu-speaker-kit.txt')
  await Promise.all(
    availablePhotos.map((photo) => downloadFromUrl(photo.src, photo.filename))
  )
}

const Speaking = () => {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const firstAvailable = availablePhotos[0]?.id || speakerPhotos[0].id
  const [selectedId, setSelectedId] = useState(firstAvailable)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [kitStatus, setKitStatus] = useState('idle')
  const [photoStatus, setPhotoStatus] = useState('idle')

  const selectedPhoto = speakerPhotos.find((photo) => photo.id === selectedId)
  const selectedAvailable = Boolean(selectedPhoto?.available && selectedPhoto.src)

  const reveal = {
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' },
  }

  useEffect(() => {
    const previousTitle = document.title
    const restorers = [
      setMetaTag('name', 'description', PAGE_DESCRIPTION),
      setMetaTag('property', 'og:title', PAGE_TITLE),
      setMetaTag('property', 'og:description', PAGE_DESCRIPTION),
      setMetaTag('property', 'og:type', 'profile'),
      setMetaTag('name', 'twitter:card', 'summary_large_image'),
      setMetaTag('name', 'twitter:title', PAGE_TITLE),
      setMetaTag('name', 'twitter:description', PAGE_DESCRIPTION),
    ]

    document.title = PAGE_TITLE

    const portrait = availablePhotos[0]?.src
    if (portrait) {
      const imageUrl = new URL(portrait, window.location.origin).href
      restorers.push(setMetaTag('property', 'og:image', imageUrl))
      restorers.push(setMetaTag('name', 'twitter:image', imageUrl))
    }

    return () => {
      document.title = previousTitle
      restorers.forEach((restore) => restore())
    }
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const target = document.querySelector(location.hash)
    target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [location.hash, reduceMotion])

  useEffect(() => {
    const onScroll = () => {
      const shouldShow = window.scrollY > 240
      setShowResources(shouldShow)
      if (!shouldShow) setResourcesOpen(false)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleDownloadPhoto = async (photo) => {
    if (!photo?.available || !photo.src) return
    try {
      setPhotoStatus('saving')
      await downloadFromUrl(photo.src, photo.filename)
      setPhotoStatus('saved')
    } catch {
      setPhotoStatus('error')
    }
    window.setTimeout(() => setPhotoStatus('idle'), 2000)
  }

  const handleDownloadKit = async () => {
    try {
      setKitStatus('saving')
      await downloadSpeakerKit()
      setKitStatus('saved')
    } catch {
      setKitStatus('error')
    }
    window.setTimeout(() => setKitStatus('idle'), 2000)
  }

  const kitLabel =
    kitStatus === 'saved'
      ? 'Downloaded'
      : kitStatus === 'error'
        ? 'Download failed'
        : kitStatus === 'saving'
          ? 'Preparing…'
          : 'Download speaker kit'

  return (
    <div className="flex flex-col mt-24">
      <Navbar />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <main className="pb-28">
        <section className="px-4 pt-8 pb-14 md:pt-16 md:pb-20 w-[98%] max-w-[880px] mx-auto">
          <p className="text-primary text-sm md:text-base tracking-wide">
          Media kit
          </p>
          <h1 className="text-secondary text-[2rem] leading-[1.15] sm:text-5xl md:text-6xl font-bold mt-3 text-balance">
            Patrick Chukwu
          </h1>
          <p className="text-primary text-xl sm:text-2xl md:text-3xl font-semibold mt-3">
            CEO, Biuda
          </p>
          <p className="text-primary text-base md:text-xl mt-6 leading-relaxed max-w-[680px]">
            I speak about technology, AI, education, entrepreneurship  and
            the opportunities they create for Africa&apos;s next generation.
            Invite me when you want a practitioner who builds products, not only
            someone who talks about them.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-8">
            <a href={SPEAKING_MAIL} className={btnPrimary}>
              Invite Patrick to speak
            </a>
            <button
              type="button"
              onClick={handleDownloadKit}
              className={btnSecondary}
            >
              {kitLabel}
            </button>
          </div>
        </section>

        <section
          aria-labelledby="oneliner-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <p className="text-primary text-sm tracking-[0.18em] uppercase">
              For flyers, slides and MCs
            </p>
            <h2
              id="oneliner-heading"
              className="text-3xl md:text-4xl text-secondary font-bold mt-3"
            >
              One-liner
            </h2>
            <blockquote className="mt-8 border-l-2 border-primary pl-5 md:pl-7">
              <p className="text-secondary text-xl md:text-2xl font-semibold leading-snug text-pretty">
                {ONE_LINER}
              </p>
            </blockquote>
            <div className="mt-6">
              <CopyButton text={ONE_LINER} label="Copy one-liner" variant="primary" />
            </div>
          </motion.div>
        </section>

        <section
          aria-labelledby="short-bio-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <p className="text-primary text-sm tracking-[0.18em] uppercase">
              About 100 words
            </p>
            <h2
              id="short-bio-heading"
              className="text-3xl md:text-4xl text-secondary font-bold mt-3"
            >
              Short bio
            </h2>
            <p className="text-primary text-sm md:text-base mt-3">
              For conference websites, event programs and announcements.
            </p>
            <p className="text-secondary text-base md:text-lg mt-6 leading-relaxed whitespace-pre-wrap">
              {SHORT_BIO}
            </p>
            <div className="mt-6">
              <CopyButton text={SHORT_BIO} label="Copy short bio" variant="primary" />
            </div>
          </motion.div>
        </section>

        <section
          aria-labelledby="full-bio-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <p className="text-primary text-sm tracking-[0.18em] uppercase">
              For press, moderators and speaker profiles
            </p>
            <h2
              id="full-bio-heading"
              className="text-3xl md:text-4xl text-secondary font-bold mt-3"
            >
              Full bio
            </h2>
            <div className="mt-6 space-y-5 text-secondary text-base md:text-lg leading-relaxed">
              {FULL_BIO.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-6">
              <CopyButton text={FULL_BIO} label="Copy full bio" variant="primary" />
            </div>
          </motion.div>
        </section>

        <section
          id="photos"
          aria-labelledby="photos-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor scroll-mt-24"
        >
          <div className="w-[98%] max-w-[880px] mx-auto">
            <motion.div {...reveal} className="max-w-[720px]">
              <h2
                id="photos-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                Speaker photos
              </h2>
              <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
                Approved images for flyers, websites and social graphics.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
              {speakerPhotos.map((photo) => {
                const isSelected = selectedId === photo.id
                return (
                  <article key={photo.id} className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(photo.id)}
                      aria-pressed={isSelected}
                      aria-label={
                        photo.available
                          ? `Select ${photo.label} photo`
                          : `${photo.label} photo is not available yet`
                      }
                      className={`text-left rounded-xl overflow-hidden border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand ${
                        isSelected
                          ? 'border-secondary ring-1 ring-secondary'
                          : 'border-bcolor hover:border-silver'
                      }`}
                    >
                      {photo.available && photo.src ? (
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="w-full aspect-[4/5] object-contain object-top bg-pic"
                        />
                      ) : (
                        <div className="aspect-[4/5] bg-grey/40 flex flex-col items-center justify-center px-4 text-center">
                          <p className="text-secondary font-medium">{photo.label}</p>
                          <p className="text-primary text-sm mt-2 break-all">
                            {photo.id}
                          </p>
                          <p className="text-primary text-sm mt-4">
                            Approved photo coming soon
                          </p>
                        </div>
                      )}
                    </button>
                    <div className="flex items-center justify-between gap-2 px-0.5">
                      <p className="text-secondary text-sm font-medium">
                        {photo.label}
                        {isSelected ? (
                          <span className="text-primary font-normal"> · Selected</span>
                        ) : null}
                      </p>
                      {photo.available && photo.src ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadPhoto(photo)}
                          className={textLink}
                        >
                          Download
                        </button>
                      ) : (
                        <span className="text-primary text-sm">Unavailable</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-8">
              <button
                type="button"
                onClick={() => handleDownloadPhoto(selectedPhoto)}
                disabled={!selectedAvailable}
                className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {photoStatus === 'saved'
                  ? 'Downloaded'
                  : photoStatus === 'error'
                    ? 'Download failed'
                    : photoStatus === 'saving'
                      ? 'Preparing…'
                      : 'Download selected photo'}
              </button>

            </div>
          </div>
        </section>

        <section
          aria-labelledby="topics-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[880px] mx-auto">
            <motion.div {...reveal} className="max-w-[720px]">
              <h2
                id="topics-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                What I speak about
              </h2>
              <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
                These are the conversations I am prepared for. Each one comes
                from building products and working in education 
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mt-12">
              {speakingTopics.map((topic, index) => (
                <motion.article key={topic.title} {...reveal}>
                  <p className="text-primary text-sm tracking-[0.18em] uppercase">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-secondary text-xl md:text-2xl font-semibold mt-2">
                    {topic.title}
                  </h3>
                  <p className="text-primary text-sm md:text-base mt-3 leading-relaxed">
                    {topic.copy}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="audiences-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <h2
              id="audiences-heading"
              className="text-3xl md:text-4xl text-secondary font-bold"
            >
              Who I speak to
            </h2>
            <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
              I am comfortable in rooms of students, builders, educators and
              operators : anyone trying to use technology to create opportunity.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <li
                  key={audience}
                  className="text-secondary text-sm md:text-base border border-bcolor rounded-md px-3 py-2"
                >
                  {audience}
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        <section
          aria-labelledby="formats-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[880px] mx-auto">
            <motion.div {...reveal} className="max-w-[720px]">
              <h2
                id="formats-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                Formats
              </h2>
              <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
                Formats I am available for. Tell me about the room and we can
                choose the right one.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 mt-12">
              {formats.map((format) => (
                <motion.article
                  key={format.title}
                  {...reveal}
                  className="border-t border-bcolor pt-5"
                >
                  <h3 className="text-secondary text-lg md:text-xl font-semibold">
                    {format.title}
                  </h3>
                  <p className="text-primary text-sm md:text-base mt-2 leading-relaxed">
                    {format.copy}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="credibility-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <div className="w-[98%] max-w-[720px] mx-auto">
            <motion.div {...reveal}>
              <h2
                id="credibility-heading"
                className="text-3xl md:text-4xl text-secondary font-bold"
              >
                Context, not a CV
              </h2>

            </motion.div>
            <ol className="relative mt-12 border-l border-bcolor ml-1 md:ml-2">
              {credentials.map((item) => (
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
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${textLink} inline-block mt-3`}
                    >
                      {item.hrefLabel}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : null}
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="media-kit"
          aria-labelledby="kit-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor scroll-mt-24"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <h2
              id="kit-heading"
              className="text-3xl md:text-4xl text-secondary font-bold"
            >
              Quick media kit
            </h2>
            <p className="text-primary text-base md:text-lg mt-4 leading-relaxed">
              Everything an organizer usually asks for, in one place. A designed
              PDF kit can be added later without changing this page.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
              <CopyButton text={ONE_LINER} label="Copy one-liner" variant="ghost" />
              <CopyButton text={SHORT_BIO} label="Copy short bio" variant="ghost" />
              <CopyButton text={FULL_BIO} label="Copy full bio" variant="ghost" />
              {availablePhotos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handleDownloadPhoto(photo)}
                  className="text-secondary border border-bcolor py-2 px-4 w-full sm:w-fit text-center font-medium rounded-md hover:border-silver hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-brand transition-colors"
                >
                  Download {photo.label.toLowerCase()}
                </button>
              ))}
              <button type="button" onClick={handleDownloadKit} className={btnPrimary}>
                {kitLabel}
              </button>
            </div>
          </motion.div>
        </section>

        <section
          aria-labelledby="final-cta-heading"
          className="px-4 py-14 md:py-20 border-t border-bcolor"
        >
          <motion.div {...reveal} className="w-[98%] max-w-[720px] mx-auto">
            <h2
              id="final-cta-heading"
              className="text-3xl md:text-4xl text-secondary font-bold"
            >
              Let&apos;s have a conversation.
            </h2>
            <p className="text-primary text-base md:text-xl mt-5 leading-relaxed">
              Planning a conference, panel, workshop or conversation around
              technology, AI, education or the future of work? I would be happy
              to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-8">
              <a href={SPEAKING_MAIL} className={btnPrimary}>
                Invite Patrick to speak
              </a>
              <a href={CONTACT_MAIL} className={btnSecondary}>
                Contact me
              </a>
            </div>
            <p className="mt-6">
              <a href={CONTACT_MAIL} className={textLink}>
                {SPEAKING_EMAIL}
              </a>
            </p>
            <p className="text-primary text-sm mt-4">
              Prefer the longer story first?{' '}
              <Link to="/about" className={textLink}>
                Read the About page
              </Link>
              .
            </p>
          </motion.div>
        </section>
      </main>

      <div
        className={`fixed bottom-4 inset-x-4 z-40 flex justify-center pointer-events-none ${
          showResources ? '' : 'hidden'
        }`}
      >
        <div className="pointer-events-auto w-full max-w-xl border border-bcolor bg-brand rounded-md">
          <button
            type="button"
            onClick={() => setResourcesOpen((open) => !open)}
            aria-expanded={resourcesOpen}
            aria-controls="speaker-resources-panel"
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-secondary font-medium hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-inset rounded-md"
          >
            <span>Speaker resources</span>
            <span aria-hidden="true" className="text-primary">
              {resourcesOpen ? '–' : '+'}
            </span>
          </button>
          {resourcesOpen ? (
            <div
              id="speaker-resources-panel"
              className="px-4 pb-4 flex flex-col sm:flex-row sm:flex-wrap gap-2"
            >
              <CopyButton text={ONE_LINER} label="Copy one-liner" variant="ghost" />
              <CopyButton text={SHORT_BIO} label="Copy short bio" variant="ghost" />
              <CopyButton text={FULL_BIO} label="Copy full bio" variant="ghost" />
              <a href="#photos" className={`${btnSecondary} sm:w-fit`} onClick={() => setResourcesOpen(false)}>
                Photos
              </a>
              <a href={SPEAKING_MAIL} className={`${btnPrimary} sm:w-fit`}>
                Invite
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Speaking
