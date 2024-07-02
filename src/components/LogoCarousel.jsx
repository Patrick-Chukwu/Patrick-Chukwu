import React, { useState, useEffect } from 'react';
import one from '../assets/logos/rhrlogo.png';
import two from '../assets/logos/banka.svg';
import three from '../assets/logos/caretrack.svg';
import five from '../assets/logos/datagrity.svg';
import four from '../assets/logos/ia.png';
import six from '../assets/logos/logo.png';
import seven from '../assets/logos/headphone.png';
import eight from '../assets/logos/imor.svg';

const logos = [
  one,
  two,
  three,
  four,
  six,
  seven,
  five,

  eight
];

const LogoCarousel = () => {
  const [currentLogos, setCurrentLogos] = useState(logos.slice(0, 4));
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogos(prevLogos => {
        const newLogos = [...prevLogos];
        newLogos.shift();
        newLogos.push(logos[(logos.indexOf(newLogos[newLogos.length - 1]) + 1) % logos.length]);
        return newLogos;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex overflow-hidden w-[80%] md:w-1/2 mx-auto place-content-center p-4 gap-4 h-24 my-2">
      {currentLogos.map((logo, index) => (
        <div
          key={index}
          className={`flex-none transition-transform duration-500 opacity-90 ${
            hoveredIndex === index ? 'transform scale-150 opacity-100' : ''
          }`}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <img src={logo} alt={`logo ${index}`} className="h-12 md:h-14 w-auto opacity-50 hover:opacity-90 focus:opacity-90" />
        </div>
      ))}
    </div>
  );
};

export default LogoCarousel;
