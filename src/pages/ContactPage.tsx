import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Calendar, CheckCircle2, Shield, Send } from 'lucide-react';

interface ContactPageProps {
  onOpenBooking: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onOpenBooking }) => {
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#1C1917] pb-24">
      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center border-b border-stone-200 overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-semibold tracking-widest text-[#9E7206] uppercase">
            Get in Touch
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1917] tracking-tight">
            Contact Golden Mind Psychiatric
          </h1>
          <p className="text-base sm:text-lg text-[#57534E] max-w-2xl mx-auto font-light leading-relaxed">
            We are here to answer your questions regarding evaluations, medication management, insurance coverage, and telehealth appointments.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Practice Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-7 rounded-3xl bg-white border border-stone-200 space-y-6 shadow-xs">
              <h2 className="text-xl font-serif font-bold text-[#1C1917]">
                Practice Contact Details
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3 text-[#44403C]">
                  <MapPin className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1C1917] block font-semibold">Service Area:</strong>
                    <span>Texas (100% Telehealth)</span>
                    <p className="text-xs text-[#78716C] mt-0.5">Serving patients statewide across Texas from the comfort of your home</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-[#44403C]">
                  <Phone className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1C1917] block font-semibold">Phone Support:</strong>
                    <a href="tel:+14329343185" className="hover:text-[#B8860B] transition-colors font-medium">+1 (432) 934-3185</a>
                    <p className="text-xs text-[#78716C] mt-0.5">Direct patient coordination line</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-[#44403C]">
                  <Mail className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1C1917] block font-semibold">Confidential Email:</strong>
                    <a href="mailto:info@goldenmindpsychiatry.org" className="hover:text-[#B8860B] transition-colors font-medium">
                      info@goldenmindpsychiatry.org
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-[#44403C]">
                  <Clock className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1C1917] block font-semibold">Practice Hours:</strong>
                    <p>Monday – Thursday: 8:00 AM – 4:00 PM</p>
                    <p>Friday: 9:00 AM – 1:00 PM</p>
                    <p>Saturday – Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <button
                  onClick={onOpenBooking}
                  className="w-full py-3.5 rounded-full font-bold text-xs sm:text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Calendar className="w-4 h-4 text-[#1C1917]" />
                  <span>Ready to Book an Appointment?</span>
                </button>
              </div>
            </div>

            {/* Emergency note */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-[#57534E] space-y-1">
              <strong className="text-rose-700 block font-semibold">Psychiatric Emergency:</strong>
              <p>
                If you are experiencing a life-threatening mental health crisis or thoughts of self-harm, please dial <strong className="text-rose-700">988</strong> or call 911 immediately.
              </p>
            </div>
          </div>

          {/* Confidential Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-3xl bg-white border border-stone-200 space-y-6 shadow-xs">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#9E7206]">
                  Send a Confidential Inquiry
                </span>
                <h3 className="text-2xl font-serif font-bold text-[#1C1917]">
                  How Can We Help You?
                </h3>
                <p className="text-xs text-[#78716C]">
                  Our care coordinator will respond within 24 business hours.
                </p>
              </div>

              {sent ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-serif font-bold text-[#1C1917]">Message Sent Successfully</h4>
                  <p className="text-xs text-[#57534E] max-w-sm mx-auto">
                    Thank you, {formData.name}. We have received your inquiry and will reach out to you shortly.
                  </p>
                  <button
                    onClick={() => { setSent(false); setFormData({ name: '', email: '', phone: '', message: '' }); }}
                    className="text-xs text-[#9E7206] font-semibold hover:underline pt-2 cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#44403C] block mb-1 font-medium">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="First & Last Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#1C1917] focus:outline-none placeholder-[#888]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#44403C] block mb-1 font-medium">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#1C1917] focus:outline-none placeholder-[#888]"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-[#44403C] block mb-1 font-medium">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="(xxx) xxx-xxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#1C1917] focus:outline-none placeholder-[#888]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#44403C] block mb-1 font-medium">Your Message or Question *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please share what questions you have about our psychiatric care, telehealth, or booking..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-stone-200 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#1C1917] focus:outline-none placeholder-[#888] resize-none"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-full font-bold text-xs sm:text-sm text-[#1C1917] bg-gold-gradient hover:shadow-[0_4px_16px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Send className="w-4 h-4 text-[#1C1917]" />
                      <span>Send Confidential Message</span>
                    </button>

                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#78716C]">
                      <Shield className="w-3 h-3 text-[#B8860B]" />
                      <span>Strict HIPAA Confidentiality Maintained</span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
