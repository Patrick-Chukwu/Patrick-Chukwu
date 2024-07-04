import React from 'react'
import Navbar from '../components/Navbar'
import Skills from '../components/Skills'

const About = () => {
  return (
    <div className='mt-24'>
      <Navbar/>
      <div className="flex flex-col items-center justify-start gap-4">
        <h2 className="text-3xl font-semibold w-[90%] max-w-[600px]">Hi, I am Patrick, <span className="text-2xl">a Software Developer at the intersection of tech, social impact and education.</span>
        </h2>
  
        <div className=" gap-4 justify-between items-center max-w-[700px]">
        <p className="text-sm md:text-xl font-medium p-4 text-left">

I am driven by a passion for leveraging technology to solve complex challenges. I thrive on delivering web solutions with exceptional user experiences while ensuring seamless functionality and optimal performance.

</p>
<p className="text-sm md:text-xl font-medium p-4 text-left">I collaborate closely with clients to understand their unique requirements while bringing creativity and attention to detail to every project. I'm committed to staying at the forefront of industry trends and technologies by continuously enhancing my skills to deliver results that exceed expectations.</p>
<h3 className="text-xl font-bold text-center text-secondary">Skills</h3>
<Skills/>
<p className="p-4 text-sm font-medium md:text-xl">When I'm not busy exploring new technologies, you'll find me contributing to courses that better humanity either through the social impact ventures I am a part of or paying it back through advocacy and actions that foster education.

They say curiosity killed the cat, but either I'm the cat that can't die or I'm here to prove them wrong!</p>
        </div>
   
      </div>

   
    </div>
  )
}

export default About