'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Linkedin, Twitter, Youtube, Facebook, Instagram, ArrowUpRight, ExternalLink, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function Footer() {
  const handleLinkClick = (linkName: string, category: string) => {
    toast.success(`🔗 ${linkName}`, {
      description: `${category} section clicked!`,
      duration: 3000,
    })
  }

  const handleContactClick = (type: string, value: string) => {
    if (type === 'email') {
      toast.info("📧 Email", {
        description: `Opening email client for ${value}`,
        duration: 3000,
      })
    } else if (type === 'location') {
      toast.info("📍 Location", {
        description: `Office located in ${value}`,
        duration: 3000,
      })
    }
  }

  const handleSocialClick = (platform: string) => {
    toast.success(`🌐 ${platform}`, {
      description: `Follow us on ${platform} for updates!`,
      duration: 3000,
    })
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success("⬆️ Back to Top", {
      description: "Welcome back to top!",
      duration: 2000,
    })
  }

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Demo", href: "/login" }
    ],
    company: [
      { name: "About Us", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#" }
    ],
    support: [
      { name: "Help Center", href: "/contact" },
      { name: "Documentation", href: "#" },
      { name: "API Status", href: "#" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Admin Login", href: "/login" }
    ]
  }

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" }
  ]

  return (
    <>
      {/* Wave SVG Divider */}
      <div className="relative bg-muted">
        <svg 
          viewBox="0 0 1440 320" 
          className="w-full h-20 fill-current text-muted"
          preserveAspectRatio="none"
        >
          <path 
            fillOpacity="1" 
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      <footer className="bg-gray-50 border-t border-gray-200 text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              {/* Brand & Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="lg:col-span-2"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Saanify</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Premium financial management solution for modern cooperative societies. 
                    Streamline operations, enhance compliance, and drive growth.
                  </p>
                </div>

                <div className="space-y-3">
                  <motion.div 
                    className="flex items-center text-slate-600 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                    onClick={() => handleContactClick('email', 'contact@saanify.com')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="h-4 w-4 mr-3 text-blue-600" />
                    <span className="text-sm">contact@saanify.com</span>
                    <ArrowUpRight className="h-3 w-3 ml-auto" />
                  </motion.div>
                  <motion.div 
                    className="flex items-center text-slate-600 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                    onClick={() => handleContactClick('location', 'Mumbai, India')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MapPin className="h-4 w-4 mr-3 text-blue-600" />
                    <span className="text-sm">Mumbai, India</span>
                    <ArrowUpRight className="h-3 w-3 ml-auto" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Footer Links */}
              {Object.entries(footerLinks).map(([category, links], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  viewport={{ once: true }}
                >
                  <h4 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
                    {category === 'product' ? 'Product' : category === 'company' ? 'Company' : category === 'support' ? 'Support' : 'Legal'}
                  </h4>
                  <ul className="space-y-2">
                    {links.map((link, linkIndex) => (
                      <motion.li 
                        key={linkIndex}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {link.name === "Admin Login" ? (
                          <Link
                            href={link.href}
                            className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200 flex items-center group"
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            {link.name}
                            <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Link>
                        ) : link.href.startsWith('#') ? (
                          <button
                            onClick={() => handleLinkClick(link.name, category)}
                            className="text-slate-600 hover:text-blue-600 text-sm transition-colors duration-200 flex items-center group"
                          >
                            {link.name}
                            <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </button>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-slate-600 hover:text-blue-600 text-sm transition-colors duration-200 flex items-center group"
                          >
                            {link.name}
                            <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Link>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Social Links & Copyright */}
          <div className="border-t border-slate-200 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-slate-600 text-sm"
              >
                ©2025 Saanify. All rights reserved. | Stay updated with our latest features and releases.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex space-x-4"
              >
                {socialLinks.map((social, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSocialClick(social.label)}
                    aria-label={social.label}
                    className="w-10 h-10 bg-slate-200 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                    whileHover={{ y: -5, rotate: 360 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <social.icon className="h-5 w-5 text-slate-600 group-hover:text-white transition-colors duration-200" />
                  </motion.button>
                ))}
                
                {/* Back to Top Button */}
                <motion.button
                  onClick={handleScrollToTop}
                  aria-label="Back to top"
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}