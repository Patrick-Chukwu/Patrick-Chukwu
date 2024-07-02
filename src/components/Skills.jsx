import React from 'react'

const Skills = () => {
  return (
    <div className='w-[95%] max-w-[700px] mx-auto p-2 md:p-4 flex flex-wrap justify-center items-center gap-1 md:gap-2 my-3'>
        <p className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">Javascript</p>
        <p className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">React</p>
        <p className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">Vue</p>
        <p className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">Wix</p>

        <p className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">AI</p>

        <p className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">Python</p>

        <p className="text-[1rem] bg-white hover:bg-brand hover:text-white hover:border-black text-black md:text-xl font-normal rounded-lg border border-brand px-3 py-1">Webflow</p>
        <p className="text-[1rem] bg-black hover:bg-white hover:text-black hover:border-black text-white md:text-xl font-normal rounded-lg border border-bcolor px-3 py-1 outline-none">Wordpress</p>
    </div>
  )
}

export default Skills