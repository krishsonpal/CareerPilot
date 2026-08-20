import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Star } from "lucide-react";
import { testimonials } from "../assets/assets";

const Testimonials = () => {
  return (
    <section className="py-20 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Success Stories
          </span>
          <h2 className="text-3xl font-extrabold text-foreground mt-3 mb-2">
            Trusted by Ambitious Candidates & Recruiters
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            See how CareerPilot connects top engineering talent with leading companies worldwide.
          </p>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            bulletClass:
              "swiper-pagination-bullet !bg-muted !opacity-100 !w-2.5 !h-2.5 !mx-1.5",
            bulletActiveClass: "!bg-primary !w-3 !h-3",
          }}
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
          }}
          className="!pb-14"
        >
          {testimonials.map((testimonial, index) => (
            <SwiperSlide key={index}>
              <div className="bg-card hover:bg-muted/30 p-7 rounded-2xl h-full flex flex-col border border-border hover:border-primary/40 shadow-2xs hover:shadow-sm transition-all">
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                
                <h3 className="text-base font-bold text-foreground mb-3">
                  {testimonial.title}
                </h3>
                <blockquote className="text-muted-foreground mb-6 flex-grow text-sm leading-relaxed">
                  "{testimonial.description}"
                </blockquote>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=10b981&color=fff`;
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-foreground text-sm">
                      {testimonial.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">
                      {testimonial.position}
                    </p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Testimonials;
