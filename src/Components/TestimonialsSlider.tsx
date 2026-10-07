"use client"; // Important: enables client-side rendering

import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const testimonials = [
  {
    title: "Wedding Album",
    stars: 5,
    quote: `Pixovo made our wedding memories come alive beautifully. The designs were elegant and everything felt so premium.`,
    name: "Mary Johnson",
    role: "Bride",
  },
  {
    title: "Baby Memory Book",
    stars: 4,
    quote: `Creating my baby's first-year album was super easy. Loved the templates, though I wish there were more customization options.`,
    name: "Michael Thompson",
    role: "Parent",
  },
  {
    title: "Portfolio Book",
    stars: 5,
    quote: `As a designer, presentation matters a lot. Pixovo helped me showcase my work in a clean and professional way.`,
    name: "James Anderson",
    role: "Graphic Designer",
  },
];
const TestimonialsSlider: React.FC = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
  };

  return (
    <Slider {...settings} className="testimonials-slider">
      {testimonials.map((t, index) => (
        <div key={index} className="testimonials-slide">
          <center>
            <h6>{t.title}</h6>
            <div className="revirew-star">
              {Array.from({ length: t.stars }).map((_, i) => (
                <img key={i} src={`${process.env.NEXT_PUBLIC_BASE_URL || ""}/images/yellow-star.svg`} alt="star" width={21} height={20} loading="lazy" decoding="async" />
              ))}
            </div>
            <h3>{t.quote}</h3>
            <h5>{t.name}</h5>
            <h4>{t.role}</h4>
          </center>
        </div>
      ))}
    </Slider>
  );
};

export default TestimonialsSlider;
