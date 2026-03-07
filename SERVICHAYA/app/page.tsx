'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-background to-white">
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg' : 'bg-white/80 backdrop-blur-lg'
      } border-b border-neutral-border/50`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent font-display hover:scale-105 transition-transform">
              SERVICHAYA
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/services" className="text-neutral-textPrimary hover:text-primary-main transition-colors font-semibold relative group">
                Services
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-main group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/providers" className="text-neutral-textPrimary hover:text-primary-main transition-colors font-semibold relative group">
                Providers
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-main group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/login" className="px-6 py-2.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-xl font-semibold hover:shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:scale-105 transition-all duration-300">
                Sign In
              </Link>
            </div>
            <div className="md:hidden">
              <Link href="/login" className="px-4 py-2 bg-primary-main text-white rounded-lg font-semibold text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary-main/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-light/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/90 backdrop-blur-sm border border-accent-green/30 rounded-full text-xs font-semibold text-accent-green mb-8 shadow-lg">
                <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></span>
                Trusted by 10,000+ Customers
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display leading-tight">
                <span className="bg-gradient-to-r from-primary-main via-primary-light to-primary-dark bg-clip-text text-transparent">
                  Services at Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-dark to-primary-main bg-clip-text text-transparent">
                  Doorstep
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-neutral-textSecondary mb-4 max-w-2xl mx-auto leading-relaxed">
                Connect with <span className="font-bold text-primary-main">verified professionals</span> in your area
              </p>
              <p className="text-base md:text-lg text-neutral-textSecondary mb-10 max-w-xl mx-auto">
                Get quality service delivered to your home. Simple, fast, and reliable.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/services" className="group relative px-10 py-4 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-2xl font-bold text-lg shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_60px_rgba(37,99,235,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  Browse Services
                  <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-light to-primary-main opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link href="/login" className="px-10 py-4 bg-white text-primary-main border-2 border-primary-main rounded-2xl font-bold text-lg hover:bg-primary-main hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Sign In
              </Link>
              <Link href="/provider/onboarding" className="px-10 py-4 bg-gradient-to-r from-accent-green to-green-600 text-white rounded-2xl font-bold text-lg shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.4)] hover:scale-105 transition-all duration-300">
                Become a Provider
              </Link>
            </div>
            
            {/* Trust Stats - Enhanced */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="inline-block p-4 bg-gradient-to-br from-primary-main/10 to-primary-light/10 rounded-3xl mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <div className="text-4xl md:text-5xl font-bold text-primary-main font-display">10K+</div>
                </div>
                <div className="text-sm md:text-base text-neutral-textSecondary font-bold">Verified Providers</div>
                <div className="text-xs text-neutral-textSecondary mt-1">Trusted professionals</div>
              </div>
              <div className="text-center group">
                <div className="inline-block p-4 bg-gradient-to-br from-accent-green/10 to-accent-green/5 rounded-3xl mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <div className="text-4xl md:text-5xl font-bold text-accent-green font-display">50K+</div>
                </div>
                <div className="text-sm md:text-base text-neutral-textSecondary font-bold">Jobs Completed</div>
                <div className="text-xs text-neutral-textSecondary mt-1">Happy customers</div>
              </div>
              <div className="text-center group">
                <div className="inline-block p-4 bg-gradient-to-br from-accent-orange/10 to-accent-orange/5 rounded-3xl mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <div className="text-4xl md:text-5xl font-bold text-accent-orange font-display">4.8★</div>
                </div>
                <div className="text-sm md:text-base text-neutral-textSecondary font-bold">Avg Rating</div>
                <div className="text-xs text-neutral-textSecondary mt-1">Excellent service</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 md:py-20 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-main via-accent-green to-primary-main"></div>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
              Our Services
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
                Popular Services
              </span>
            </h2>
            <p className="text-base md:text-lg text-neutral-textSecondary max-w-2xl mx-auto">
              Choose from our most trusted service categories. All providers verified and background checked.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-7xl mx-auto">
            {[
              { name: 'AC Repair', icon: '❄️', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', count: '2.5K+', desc: 'Expert AC servicing' },
              { name: 'Plumbing', icon: '🔧', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', count: '1.8K+', desc: '24/7 plumbing solutions' },
              { name: 'Electrical', icon: '⚡', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-50', count: '2.2K+', desc: 'Safe electrical work' },
              { name: 'Cleaning', icon: '✨', color: 'from-green-500 to-green-600', bg: 'bg-green-50', count: '3.1K+', desc: 'Deep cleaning services' },
            ].map((service) => (
              <Link
                key={service.name}
                href={`/services?category=${service.name.toLowerCase().replace(' ', '-')}`}
                className="group relative bg-white rounded-3xl p-6 md:p-7 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border-2 border-transparent hover:border-primary-main/30 overflow-hidden"
              >
                {/* Hover Effect Background */}
                <div className={`absolute inset-0 ${service.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className={`w-18 h-18 md:w-20 md:h-20 bg-gradient-to-br ${service.color} rounded-3xl flex items-center justify-center text-4xl mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    {service.icon}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-neutral-textPrimary mb-2 group-hover:text-primary-main transition-colors">{service.name}</h3>
                  <p className="text-xs md:text-sm text-neutral-textSecondary mb-3">{service.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-border/50">
                    <span className="text-xs font-bold text-primary-main">{service.count} providers</span>
                    <svg className="w-5 h-5 text-primary-main opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </Link>
            ))}
          </div>
          
          {/* View All Services */}
          <div className="text-center mt-10">
            <Link href="/services" className="inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary-main to-primary-dark text-white rounded-2xl font-bold text-base hover:shadow-xl hover:scale-105 transition-all duration-300">
              View All Services
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-neutral-background via-white to-neutral-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05),transparent_50%)]"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-accent-green/10 text-accent-green rounded-full text-xs font-semibold mb-4">
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-base md:text-lg text-neutral-textSecondary max-w-2xl mx-auto">
              Get services delivered to your doorstep in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto">
            {[
              { step: '1', title: 'Select Service', desc: 'Browse and choose the service you need from our wide range of categories', icon: '🎯', color: 'from-blue-500 to-blue-600' },
              { step: '2', title: 'Get Matched', desc: 'We instantly connect you with verified professionals in your area', icon: '🤝', color: 'from-primary-main to-primary-dark' },
              { step: '3', title: 'Service Done', desc: 'Get quality service delivered right at your doorstep. Fast and reliable', icon: '✅', color: 'from-accent-green to-green-600' },
            ].map((item, index) => (
              <div key={item.step} className="relative group">
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-20 left-full w-full h-1 -z-10">
                    <div className="h-full bg-gradient-to-r from-primary-main via-primary-light to-primary-main opacity-30 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-primary-main rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                  </div>
                )}
                <div className="bg-white rounded-3xl p-8 md:p-9 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-primary-main/30 text-center h-full flex flex-col items-center group-hover:scale-105">
                  {/* Step Number Badge */}
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-primary-main to-primary-dark rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg z-10">
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center text-5xl mb-6 mt-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    {item.icon}
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 font-display text-neutral-textPrimary group-hover:text-primary-main transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base text-neutral-textSecondary leading-relaxed">
                    {item.desc}
                  </p>
                  
                  {/* Decorative Element */}
                  <div className="mt-6 w-20 h-1 bg-gradient-to-r from-transparent via-primary-main to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-accent-orange/10 text-accent-orange rounded-full text-xs font-semibold mb-4">
              Why SERVICHAYA
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
                Why Choose Us
              </span>
            </h2>
            <p className="text-base md:text-lg text-neutral-textSecondary max-w-2xl mx-auto">
              Experience the difference with our trusted service platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              { icon: '✓', title: 'Verified Providers', desc: 'All service providers are background verified and certified', color: 'text-accent-green', bg: 'from-accent-green/20 to-accent-green/10' },
              { icon: '⚡', title: 'Instant Matching', desc: 'Get matched with professionals in your area within minutes', color: 'text-primary-main', bg: 'from-primary-main/20 to-primary-light/10' },
              { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges. See prices upfront before booking', color: 'text-accent-orange', bg: 'from-accent-orange/20 to-accent-orange/10' },
              { icon: '🛡️', title: 'Secure Payments', desc: 'Your payments are protected with our escrow system', color: 'text-primary-main', bg: 'from-primary-main/20 to-primary-light/10' },
              { icon: '⭐', title: 'Quality Guaranteed', desc: 'Rate and review providers. Quality service assured', color: 'text-accent-orange', bg: 'from-accent-orange/20 to-accent-orange/10' },
              { icon: '📱', title: 'Easy to Use', desc: 'Simple booking process. Track your service in real-time', color: 'text-accent-green', bg: 'from-accent-green/20 to-accent-green/10' },
            ].map((feature, index) => (
              <div key={index} className="group bg-gradient-to-br from-white to-neutral-background rounded-3xl p-6 md:p-7 border-2 border-neutral-border hover:border-primary-main/40 hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.bg} rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-neutral-textPrimary group-hover:text-primary-main transition-colors">{feature.title}</h3>
                <p className="text-sm md:text-base text-neutral-textSecondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - New */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-white to-neutral-background">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 bg-primary-main/10 text-primary-main rounded-full text-xs font-semibold mb-4">
              Customer Reviews
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-primary-main to-primary-dark bg-clip-text text-transparent">
                What Our Customers Say
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Rajesh Kumar', location: 'Indore', rating: 5, text: 'Excellent service! Got my AC fixed within 2 hours. The technician was professional and the pricing was transparent.', avatar: '👨' },
              { name: 'Priya Sharma', location: 'Khandwa', rating: 5, text: 'Best platform for home services. Verified providers and secure payments. Highly recommended!', avatar: '👩' },
              { name: 'Amit Patel', location: 'Khargone', rating: 5, text: 'Quick response time and quality work. The matching algorithm found the perfect plumber for my needs.', avatar: '👨' },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-3xl p-6 md:p-7 shadow-lg hover:shadow-xl transition-all duration-300 border border-neutral-border hover:border-primary-main/30">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-accent-orange" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm md:text-base text-neutral-textSecondary mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-neutral-border">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-main/20 to-primary-light/10 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-neutral-textPrimary">{testimonial.name}</div>
                    <div className="text-xs text-neutral-textSecondary">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-primary-main via-primary-light to-primary-dark relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-block px-5 py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold mb-6">
              🎉 Join 10,000+ Happy Customers
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display leading-tight">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg mb-10 text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Join thousands of satisfied customers. Book your first service today and experience the difference!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services" className="group px-10 py-4 bg-white text-primary-main rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3">
                <span>Explore Services</span>
                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/login" className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300">
                Sign In Now
              </Link>
              <Link href="/provider/onboarding" className="px-10 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/30 hover:scale-105 transition-all duration-300">
                Join as Provider
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-textPrimary text-white py-10 md:py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-3 font-display bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                SERVICHAYA
              </div>
              <p className="text-neutral-textSecondary mb-3 text-sm">सेवा आपके द्वार पर</p>
              <p className="text-xs text-neutral-textSecondary">
                Trusted service marketplace connecting customers with verified professionals.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm">Services</h4>
              <ul className="space-y-1.5 text-xs text-neutral-textSecondary">
                <li><Link href="/services" className="hover:text-white transition-colors">AC Repair</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Plumbing</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Electrical</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Cleaning</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm">Company</h4>
              <ul className="space-y-1.5 text-xs text-neutral-textSecondary">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-sm">Support</h4>
              <ul className="space-y-1.5 text-xs text-neutral-textSecondary">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-neutral-textSecondary">
              © 2024 SERVICHAYA. All rights reserved. | Made with ❤️ in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
