import React from 'react'
import Navbar from '../components/Navbar'
import Skills from '../components/Skills'
import Popout from '../components/Popout'
import Projects from '../components/Projects'

const Portfolio = () => {
  return (
    <div className='mt-24'>
      <Navbar/>
      <h2 className="text-2xl text-secondary font-semibold text-center">Skills</h2>
      <Skills/>
      <Popout/>
      <Projects/>
    </div>
  )
}

export default Portfolio