import { motion } from 'framer-motion'
import project1 from "../assets/Projectts/project1.webp"
import project2 from "../assets/Projectts/project2.webp"
import project3 from "../assets/Projectts/project3.webp"
import project4 from "../assets/Projectts/project4.webp"
import timbucloud from "../assets/Projectts/timbucloud.webp"
import integreated from "../assets/Projectts/integreated.webp"

const projectList = [
  {
    name: "Highfrica Academy",
    description: "Developed a web application for an edtech. ",
    href: "https://www.highfrica.com/",
    image: integreated,
    alt: "Integreated Academy landing page",
  },
  {
    name: "CareTrackPlus",
    description: "Developed a web application for a HealthCare Management System. Built functionalities such as tracking patient's appointments, staff management dashboard and graphical visualization of hospital's daily operations. ",
    href: "https://caretrack.vercel.app/",
    image: project1,
    alt: "CareTrackPlus landing page",
  },
  {
    name: "Respectech",
    description: "Developed the website for Africa's biggest tech event.",
    href: "https://respectechconference.vercel.app/",
    image: project4,
    alt: "Respectech Conference landing page",
  },
  {
    name: "Timbucloud",
    description: "Developed an E-commerse platform to ensure smooth operation of a one-stop shop for tech gadgets.",
    href: "https://timbucloud.vercel.app/",
    image: timbucloud,
    alt: "timbucloud page",
  },
  {
    name: "Banka",
    description: "Built a web application for a Fintech Platform.",
    href: "https://ourbanka.com/",
    image: project2,
    alt: "Image of Banka landing page",
  },
  {
    name: "Siliconverse",
    description: "Collaborated on the frontend team of a HR service Platform.",
    href: "https://siliconverse.net/",
    image: project3,
    alt: "Siliconverse landing page",
  },
]

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none" aria-hidden="true">
    <path d="M11.666 2.89001H17.4993V8.72335" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17.5 12.6707V16.64C17.5 17.3304 16.9404 17.89 16.25 17.89H3.75C3.05965 17.89 2.5 17.3304 2.5 16.64V4.14001C2.5 3.44966 3.05965 2.89001 3.75 2.89001H7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M10.75 9.64001L17.125 3.26501" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
)

const Projects = ({ limit }) => { // eslint-disable-line react/prop-types
  const visibleProjects = typeof limit === 'number' ? projectList.slice(0, limit) : projectList

  return (
    <div className='flex flex-col gap-4 items-center justify-center my-8'>
      {visibleProjects.map((project) => (
        <motion.div key={project.name} className='flex flex-col gap-4 items-center justify-center max-w-[700px] w-[98%] mx-auto'>
          <div className="w-[98%] flex justify-between items-center mx-auto px-2">
          <motion.h2 className='text-2xl md:text-3xl font-bold text-left min-w-0 md:min-w-[300px] pr-2'>{project.name}</motion.h2>
         <a href={project.href} target='_blank' rel="noopener noreferrer" aria-label={`Open ${project.name} (opens in a new tab)`}> <ExternalLinkIcon /></a>
        
          </div>
          <p className="text-sm text-primary px-2 font-normal text-left w-full">{project.description}</p>
          <div className='border border-bcolor rounded-xl p-2'>
            <a href={project.href} target='_blank' rel="noopener noreferrer"><motion.img initial={{scale:.8, opacity:0,}} whileInView={{scale: 1, opacity:1}} src={project.image} className='w-full mx-auto rounded-xl' alt={project.alt} /></a>
          </div>

        </motion.div>
      ))}
    </div>
  )
}

export default Projects
