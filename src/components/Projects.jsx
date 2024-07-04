import { motion } from 'framer-motion'
import React from 'react'
import project1 from "../assets/Projectts/project1.webp"
import { FaHandPointer, FaICursor, FaMousePointer } from 'react-icons/fa'
import { FaFile } from 'react-icons/fa6'

const Projects = () => {
  return (
    <div className='flex flex-col gap-4 items-center justify-center my-8'>
        <motion.div className='flex flex-col gap-4 items-center justify-center max-w-[700px] w-[98%] mx-auto'>
          <div className="w-[98%] flex justify-between items-center mx-auto px-2">
          <motion.h2 className='text-3xl font-bold text-left min-w-[300px]'>CareTrackPlus</motion.h2>
         <a href="https://caretrack.vercel.app/" target='_blank'> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="none"><path d="M11.666 2.89001H17.4993V8.72335" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.5 12.6707V16.64C17.5 17.3304 16.9404 17.89 16.25 17.89H3.75C3.05965 17.89 2.5 17.3304 2.5 16.64V4.14001C2.5 3.44966 3.05965 2.89001 3.75 2.89001H7.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10.75 9.64001L17.125 3.26501" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></a>
        
          </div>
          <p className="text-sm text-primary px-2 font-normal text-left w-full">Developed a web application for a HealthCare Management System.</p>
          <div className='border border-bcolor rounded-xl p-2'>
            <a href="https://caretrack.vercel.app/" target='_blank'><img src={project1} className='w-full mx-auto rounded-xl opacity-20' alt="CareTrackPlus landing page" /></a>
          </div>

        </motion.div>
    </div>
  )
}

export default Projects