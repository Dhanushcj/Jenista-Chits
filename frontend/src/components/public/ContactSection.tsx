import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-neutral-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-950 mb-4">Get in Touch</h2>
          <p className="text-neutral-600 text-lg">
            Have questions about our chit plans? Our financial advisors are ready to help you plan a better future.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
              <h3 className="text-2xl font-bold text-primary-950 mb-8">Head Office</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-primary-50 p-3 rounded-lg mr-4 text-primary-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-950">Location</h4>
                    <p className="text-neutral-600 mt-1">123 Financial District, Tech Park Road,<br />Mumbai, Maharashtra 400001</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-50 p-3 rounded-lg mr-4 text-primary-500">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-950">Call Us</h4>
                    <p className="text-neutral-600 mt-1">Toll Free: 1800-123-4567<br />Support: +91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-50 p-3 rounded-lg mr-4 text-primary-500">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-950">Email</h4>
                    <p className="text-neutral-600 mt-1">support@trustchit.in<br />info@trustchit.in</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-50 p-3 rounded-lg mr-4 text-primary-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-950">Working Hours</h4>
                    <p className="text-neutral-600 mt-1">Mon - Sat: 9:30 AM to 6:30 PM<br />Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-neutral-200">
            <h3 className="text-2xl font-bold text-primary-950 mb-2">Send a Message</h3>
            <p className="text-neutral-500 mb-8">We will get back to you within 24 hours.</p>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">First Name</label>
                  <Input placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">Last Name</label>
                  <Input placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Email Address</label>
                <Input type="email" placeholder="john@example.com" />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Phone Number</label>
                <Input type="tel" placeholder="+91 98765 43210" />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">Message</label>
                <textarea 
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <Button type="button" variant="primary" className="w-full h-12">
                Send Message
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};
