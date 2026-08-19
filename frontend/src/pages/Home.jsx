import React, { useContext, useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import AIChatTeaser from "../components/AIChatTeaser";
import JobCategory from "../components/JobCategory";
import FeaturedJob from "../components/FeaturedJob";
import Testimonials from "../components/Testimonials";
import Counter from "../components/Counter";
import Footer from "../components/Footer";
import { AppContext } from "../context/AppContext";

const Home = () => {
  const { fetchJobsData } = useContext(AppContext);

  useEffect(() => {
    fetchJobsData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <AIChatTeaser />
        <JobCategory />
        <FeaturedJob />
        <Testimonials />
        <Counter />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
