import React from 'react'
import Navbar from '../components/Navbar'
import ImageSlider from '../components/ImageSlider'
import {  FaGithub, FaMailBulk  } from 'react-icons/fa'
import LogoCarousel from '../components/LogoCarousel'
import Skills from '../components/Skills'

const Home = () => {
  return (
    <div className='flex flex-col mt-24'>
        <Navbar/>
        <section className="pl-4 h-dvh flex flex-col items-left justify-start items-center">
          <>
          <h2 className='text-primary text-2xl'>Meet Patrick Chukwu</h2>
          <p className="text-secondary font-semibold text-3xl">Front-end Developer</p>
          <p className='text-primary text-2xl'>Building amazing stuff.</p>
          </>
          
          <div className="flex justify-between gap-8 w-[90%] items-center p-4 md:w-1/2 mx-auto my-4">
          <a href="https://calendar.app.google/zYzRKYgvBGGoMdw18" target='_blank' className='text-white bg-bcolor px-4 py-2 rounded-md hover:bg-white hover:text-bcolor font-medium border border-black'>Book a call</a>
         
         <div className="flex justify-center gap-2">
         <a href="https://github.com/Patrick-Chukwu" target='_blank' className='border-none rounded-full p-1 bg-primary text-black hover:text-black hover:bg-white'><FaGithub/></a>
         <a href="mailto:chukwupatrickify@gmail.com" target='_blank' className='border-none rounded-full p-1 bg-primary text-black hover:text-black hover:bg-white'><FaMailBulk/></a>
         </div>
          
          </div>
          <ImageSlider/>


        </section>
        <section>
          <LogoCarousel/>
          <h2 className="text-2xl font-semibold text-center text-secondary">Skills</h2>

        <Skills/>
        </section>
    </div>
  )
}

export default Home