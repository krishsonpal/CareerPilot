import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { faqs } from "../assets/assets";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { SlideLeft, SlideUp } from "../utils/Animation";

const Terms = () => {
  return (
    <>
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-background min-h-screen">
        {/* Back Link & Page Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Terms and Conditions
            </h1>
            <p className="text-sm text-muted-foreground">
              Last updated: September 2026 • CareerPilot AI Platform
            </p>
          </div>
        </div>
        {/* Terms Content */}
        <div>
          {faqs.map((faq) => (
            <motion.div
              variants={SlideLeft(0.3)}
              initial="hidden"
              whileInView="visible"
              key={faq.id}
              className="border border-border rounded-xl hover:bg-muted/40 transition-colors duration-200 mb-5 bg-card"
            >
              <div className="p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 flex items-start">
                  <span className="text-primary mr-3">{faq.id}.</span>
                  {faq.title}
                </h2>
                <div className="text-muted-foreground space-y-4 pl-9">
                  <p className="leading-relaxed">{faq.description1}</p>
                  {faq.description2 && (
                    <p className="leading-relaxed">{faq.description2}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Additional Legal Notice */}
        <motion.div
          variants={SlideUp(0.3)}
          initial="hidden"
          whileInView="visible"
          className="mt-12 bg-primary/10 rounded-xl p-6 border border-primary/20"
        >
          <h3 className="text-lg font-medium text-primary mb-3">
            Legal Notice
          </h3>
          <p className="text-foreground">
            By using our services, you agree to these terms and conditions in
            full. If you disagree with any part of these terms, please do not
            use our services.
          </p>
        </motion.div>
      </section>
      <Footer />
    </>
  );
};

export default Terms;
