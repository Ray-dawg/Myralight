import React from "react";
import Navbar from "./layout/Navbar";
import HeroSection from "./sections/HeroSection";
import FeatureGrid from "./sections/FeatureGrid";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Truck,
  BarChart2,
  Shield,
  Clock,
  MessageSquare,
} from "lucide-react";

interface HomeProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

const Home = ({
  onLogin = () => (window.location.href = "/login"),
  onRegister = () => (window.location.href = "/register"),
}: HomeProps) => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogin={onLogin} onRegister={onRegister} />
      <main>
        <HeroSection onLogin={onLogin} onRegister={onRegister} />
        <FeatureGrid />

        {/* How It Works Section */}
        <section className="py-24 bg-gray-50" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
                  Simple Process
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  How Myra Works for Your Business
                </h2>
                <p className="text-xl text-gray-600">
                  Our streamlined platform makes logistics management simple and
                  efficient
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {[
                {
                  icon: Truck,
                  title: "Connect",
                  description:
                    "Create your account and connect with verified carriers or shippers in our marketplace.",
                  color: "blue",
                },
                {
                  icon: BarChart2,
                  title: "Manage",
                  description:
                    "Use our intuitive dashboard to track shipments, optimize routes, and manage documentation.",
                  color: "indigo",
                },
                {
                  icon: Shield,
                  title: "Optimize",
                  description:
                    "Leverage AI-powered insights to reduce costs, improve efficiency, and grow your business.",
                  color: "purple",
                },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="relative"
                  >
                    {/* Step number */}
                    <div
                      className={`absolute -top-4 -left-4 w-16 h-16 rounded-full bg-${step.color}-100 flex items-center justify-center z-10 border-4 border-white`}
                    >
                      <span
                        className={`text-${step.color}-600 text-xl font-bold`}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* Step content */}
                    <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 h-full">
                      <div
                        className={`w-16 h-16 rounded-full bg-${step.color}-100 flex items-center justify-center mb-6`}
                      >
                        <Icon className={`w-8 h-8 text-${step.color}-600`} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {step.title}
                      </h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>

                    {/* Connector line */}
                    {index < 2 && (
                      <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-1 bg-gray-200 z-0">
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-gray-300"></div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  Success Stories
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  What Our Customers Say
                </h2>
                <p className="text-xl text-gray-600">
                  Join thousands of satisfied logistics professionals using our
                  platform
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  quote:
                    "Myra has completely transformed how we manage our fleet. We've seen a 32% reduction in empty miles and our drivers are much happier.",
                  author: "Sarah Johnson",
                  role: "Fleet Manager, TransCargo Inc.",
                  image:
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
                },
                {
                  quote:
                    "The real-time analytics have given us insights we never had before. We've optimized our routes and saved thousands in fuel costs alone.",
                  author: "Michael Chen",
                  role: "Operations Director, FastFreight",
                  image:
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
                },
                {
                  quote:
                    "As a small carrier, Myra has leveled the playing field. We now compete with the big players and have grown our business by 40% in just six months.",
                  author: "David Rodriguez",
                  role: "Owner, Rodriguez Trucking",
                  image:
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={testimonial.author}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 h-full flex flex-col">
                    <div className="mb-6">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xl">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-6 flex-grow">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center">
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full mr-4 border-2 border-blue-100"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {testimonial.author}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 bg-gray-50" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                  Flexible Plans
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Pricing Plans for Every Business Size
                </h2>
                <p className="text-xl text-gray-600">
                  Choose the plan that fits your needs and scale as you grow
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Starter",
                  price: "$99",
                  description:
                    "Perfect for small businesses just getting started with logistics management.",
                  features: [
                    "Up to 10 active shipments",
                    "Basic analytics dashboard",
                    "Email support",
                    "Mobile app access",
                    "Document management",
                  ],
                  cta: "Start Free Trial",
                  popular: false,
                  color: "blue",
                },
                {
                  name: "Professional",
                  price: "$299",
                  description:
                    "Ideal for growing businesses with moderate logistics needs.",
                  features: [
                    "Up to 100 active shipments",
                    "Advanced analytics & reporting",
                    "Priority support",
                    "API access",
                    "Route optimization",
                    "Carrier marketplace access",
                    "Custom integrations",
                  ],
                  cta: "Start Free Trial",
                  popular: true,
                  color: "indigo",
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description:
                    "Tailored solutions for large-scale logistics operations.",
                  features: [
                    "Unlimited active shipments",
                    "Custom analytics & reporting",
                    "24/7 dedicated support",
                    "Advanced API access",
                    "White-label options",
                    "Custom development",
                    "Dedicated account manager",
                  ],
                  cta: "Contact Sales",
                  popular: false,
                  color: "purple",
                },
              ].map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <div
                    className={`bg-white rounded-xl p-8 shadow-lg border ${plan.popular ? "border-indigo-200 ring-2 ring-indigo-500 ring-opacity-50" : "border-gray-100"} h-full flex flex-col`}
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.price !== "Custom" && (
                        <span className="text-gray-500">/month</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    <div className="flex-grow">
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start">
                            <CheckCircle2
                              className={`h-5 w-5 text-${plan.color}-500 mr-2 flex-shrink-0 mt-0.5`}
                            />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      className={`w-full ${plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-900 hover:bg-gray-800"} text-white`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-24 bg-white" id="contact">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get In Touch
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Ready to Transform Your Logistics Operations?
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Our team of experts is ready to help you implement the perfect
                  logistics solution for your business.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {[
                    {
                      icon: Clock,
                      title: "Fast Implementation",
                      description:
                        "Get up and running in as little as 48 hours",
                    },
                    {
                      icon: Shield,
                      title: "Dedicated Support",
                      description: "Expert assistance every step of the way",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-14 rounded-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                >
                  Schedule a Demo
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-gray-50 rounded-xl p-8 shadow-lg border border-gray-100"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Contact Us
                </h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Your Company Inc."
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Tell us about your logistics needs..."
                    ></textarea>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                    Send Message
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              <div>
                <div className="flex items-center mb-6">
                  <Truck className="h-8 w-8 text-blue-400 mr-2" />
                  <h2 className="text-2xl font-bold text-white">MYRA</h2>
                </div>
                <p className="text-gray-400 mb-6">
                  Revolutionizing logistics with cutting-edge technology and
                  transparent solutions.
                </p>
                <div className="flex space-x-4">
                  {["facebook", "twitter", "linkedin", "instagram"].map(
                    (social) => (
                      <a
                        key={social}
                        href={`#${social}`}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <span className="sr-only">{social}</span>
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                          {/* Placeholder for social icons */}
                          <span className="text-sm">
                            {social[0].toUpperCase()}
                          </span>
                        </div>
                      </a>
                    ),
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Solutions</h3>
                <ul className="space-y-4">
                  {[
                    "For Shippers",
                    "For Carriers",
                    "For Drivers",
                    "For Brokers",
                    "Enterprise",
                  ].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Company</h3>
                <ul className="space-y-4">
                  {["About Us", "Careers", "Press", "Blog", "Contact"].map(
                    (item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {item}
                        </a>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Resources</h3>
                <ul className="space-y-4">
                  {[
                    "Documentation",
                    "API",
                    "Guides",
                    "Case Studies",
                    "Support",
                  ].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                © 2023 Myra Logistics, Inc. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (item) => (
                    <a
                      key={item}
                      href="#"
                      className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                    >
                      {item}
                    </a>
                  ),
                )}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;
