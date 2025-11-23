'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Linkedin, Twitter, Youtube, Facebook, Instagram, ArrowUpRight, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function Footer() {
  const handleLinkClick = (linkName: string, category: string) => {
    if (linkName === "Admin Login") {
      window.location.href = '/login'
      return
    }
    toast.success(`🔗 ${linkName}`, {
      description: `${category} section coming soon!`,
      duration: 3000,
    })
  }

  const handleContactClick = (type: string, value: string) => {
    if (type === 'phone') {
      toast.info("📞 Phone", {
        description: `Calling ${value}...`,
        duration: 3000,
      })
    } else if (type === 'email') {
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
      { name: "Home", href: "#" },
      { name: "Features", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "Demo", href: "#" }
    ],
    company: [
      { name: "About Us", href: "#" },
      { name: "Contact", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#" }
    ],
    support: [
      { name: "Help Center", href: "#" },
      { name: "Documentation", href: "#" },
      { name: "API Reference", href: "#" },
      { name: "Status", href: "#" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "Admin Login", href: "#" }
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

      <footer className="bg-foreground text-background">
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
                  <h3 className="text-2xl font-bold text-background mb-2">Saanify</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Premium society management solution for modern residential communities. 
                    Streamline operations, enhance engagement, and drive growth.
                  </p>
                </div>

                <div className="space-y-3">
                  <motion.div 
                    className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors duration-200"
                    onClick={() => handleContactClick('phone', '+91 98765 43210')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Phone className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm">+91 98765 43210</span>
                    <ArrowUpRight className="h-3 w-3 ml-auto" />
                  </motion.div>
                  <motion.div 
                    className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors duration-200"
                    onClick={() => handleContactClick('email', 'contact@saanify.com')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm">contact@saanify.com</span>
                    <ArrowUpRight className="h-3 w-3 ml-auto" />
                  </motion.div>
                  <motion.div 
                    className="flex items-center text-muted-foreground cursor-pointer hover:text-primary transition-colors duration-200"
                    onClick={() => handleContactClick('location', 'Mumbai, India')}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MapPin className="h-4 w-4 mr-3 text-primary" />
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
                  <h4 className="text-lg font-semibold text-background mb-4 capitalize">
                    {category === 'product' ? 'Product' : category === 'company' ? 'Company' : category === 'support' ? 'Support' : 'Legal'}
                  </h4>
                  <ul className="space-y-2">
                    {links.map((link, linkIndex) => (
                      <motion.li 
                        key={linkIndex}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          onClick={() => handleLinkClick(link.name, category)}
                          className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200 flex items-center group"
                        >
                          {link.name}
                          <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Social Links & Copyright */}
          <div className="border-t border-gray-800 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-gray-400 text-sm"
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
                    className="w-10 h-10 bg-gray-800 hover:bg-sky-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                    whileHover={{ y: -5, rotate: 360 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <social.icon className="h-5 w-5 group-hover:text-white transition-colors duration-200" />
                  </motion.button>
                ))}
                
                {/* Back to Top Button */}
                <motion.button
                  onClick={handleScrollToTop}
                  aria-label="Back to top"
                  className="w-10 h-10 bg-sky-600 hover:bg-sky-700 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowUpRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}