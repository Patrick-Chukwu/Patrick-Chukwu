import React from 'react'
import Navbar from '../components/Navbar'
import ImageSlider from '../components/ImageSlider'
import {  FaGithub, FaMailBulk  } from 'react-icons/fa'
import LogoCarousel from '../components/LogoCarousel'
import Skills from '../components/Skills'
import Footer from '../components/Footer'
import Projects from '../components/Projects'

const Home = () => {
  return (
    <div className='flex flex-col mt-24'>
        <Navbar/>
        <section className="p-2 h-dvh flex flex-col items-left justify-start items-center">
          <div className=' pl-2'>
          <h2 className='text-primary text-2xl text-left'>Meet Patrick Chukwu</h2>
          <p className="text-secondary font-semibold text-3xl text-left">A Software Developer</p>
          <p className='text-primary text-2xl text-left'>Building amazing stuff.</p>
          <p className='text-secondary text-sm text-left'>I help businesses build amazing web applications and products that scale with great user experiences.</p>

          </div>
          
          <div className="flex justify-between gap-8 w-[95%] items-center p-2 md:w-1/2 mx-auto my-4">
          <a href="https://calendar.app.google/zYzRKYgvBGGoMdw18" target='_blank' className='text-white bg-bcolor px-4 py-2 rounded-md hover:bg-white hover:text-bcolor font-medium border border-black'>Book a call</a>
         
         <div className="flex justify-center items-center gap-2">
         <a href="https://github.com/Patrick-Chukwu" target='_blank' className='border-none rounded-full p-1 bg-primary text-black hover:text-black hover:bg-white'><FaGithub/></a>
         <a href="mailto:chukwupatrickify@gmail.com" target='_blank' className='border-none rounded-full p-1 bg-primary text-black hover:text-black hover:bg-white'><FaMailBulk/></a>
         </div>
          
          </div>
          <ImageSlider/>


        </section>
        <section>
          <LogoCarousel/>
        </section>
      <section>
        <Projects/>
      </section>
        <Footer/>
    </div>
  )
}

export default Home