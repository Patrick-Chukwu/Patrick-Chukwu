import React from 'react'
import { motion } from 'framer-motion'

const Skills = () => {
  return (
    <div className='w-[98%] max-w-[700px] mx-auto p-2 md:p-4 flex flex-wrap justify-center items-center gap-2 md:gap-3 my-3'>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}} className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">Javascript</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">React</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">Nextjs</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">Nodejs</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">Vue</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">Wix</motion.p>

        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">AI</motion.p>

        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">Python</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">MySQL</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">MongoDB</motion.p>

        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">Webflow</motion.p>
        <motion.p whileTap={{scale: 1.2}} whileHover={{scale: .8}}  className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">Wordpress</motion.p>
    </div>
  )
}

export default Skills