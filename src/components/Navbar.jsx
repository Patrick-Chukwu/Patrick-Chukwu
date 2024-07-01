import React, {useState} from 'react'
import logo from '../assets/Patrick.png'
import { Link } from 'react-router-dom';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaTwitter, FaX, FaXTwitter } from 'react-icons/fa6';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };
    const closeMenu = () => {
        setIsOpen(false);
    };
  return (
    <nav className='p-4 border border-bcolor bg-transparent fixed top-0 left-0 w-full'>
      <div className='flex items-center justify-between'>
      <div className="hidden md:flex justify-between items-center gap-2">
            <Link to="/" className='font-medium text-xl'>Home</Link>
            <Link to="/about" className='font-medium text-xl'>About</Link>
            <Link to="" className='font-medium text-xl'>CV</Link>

        </div>
        <Link to="/"><img src={logo} className='bg-primary rounded-full size-10' alt="Chukwu Patrick Ifeanyi" /></Link>
        <div className="flex items-center justify-center gap-2">
        <div className="flex justify-center items-center gap-1">
          <a href="" className='border-none rounded-full p-1 hover:bg-primary text-primary hover:text-black'><FaLinkedin/></a>
          <a href=""><FaInstagram/></a>
          <a href=""><FaXTwitter/></a>

        </div>
        <div className="-mr-2 flex lg:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-black inline-flex items-center justify-center p-2 rounded-md text-primary hover:text-black hover:bg-primary focus:outline-none focus:bg-primary focus:text-black"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>


      </div>
   
          <div className={`${isOpen ? 'block' : 'hidden'} lg:hidden`} id="mobile-menu">
        <div className="max-h-dvh px-1 pt-2 pb-60 space-y-1 sm:px-3 flex flex-col gap-2 text-xl font-normal text-primary relative z-50 bg-brand">
          <Link onClick={closeMenu}
 to="/" className="text-silver font-normal text-xl block px-3 py-2 rounded-md  hover:bg-gray-200">
            Home
          </Link>

          <Link onClick={closeMenu}
to="/about" className="text-silver font-normal text-xl block px-3 py-2 rounded-md hover:bg-gray-200">
            About
          </Link>
          <Link onClick={closeMenu}
 to="/portfolio" className="text-silver font-normal text-xl block px-3 py-2 rounded-md hover:bg-gray-200">
            Portfolio
          </Link>
          <Link onClick={closeMenu}
 to="/blog" className="text-silver font-normal text-xl block px-3 py-2 rounded-md hover:bg-gray-200">
            Blog
          </Link>
       <Link to='' onClick={closeMenu}
 className='bg-primary text-black py-2 px-6 w-40 max-w-44 font-medium hover:bg-secondary rounded-md lg:rounded-lg md:rounded-md xl:rounded-xl '>Book a call</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar