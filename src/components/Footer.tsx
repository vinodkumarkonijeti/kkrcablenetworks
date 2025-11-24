import { Phone, MapPin, Mail, Globe } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 mt-1 text-blue-400" />
            <div>
              <h3 className="font-semibold mb-1">Customer Service</h3>
              <p className="text-gray-300">📞 +91 7661801838</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 mt-1 text-blue-400" />
            <div>
              <h3 className="font-semibold mb-1">Address</h3>
              <p className="text-gray-300">
                KKR CABLE NETWORKS, Narasingolu village, Zarugumalli mandal,<br />
                Prakasam district, Andhra Pradesh, 523271.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 mt-1 text-blue-400" />
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <a href="mailto:kkrcablenetworks@gmail.com" className="text-blue-400 hover:text-blue-300 transition">
                kkrcablenetworks@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Globe className="w-5 h-5 mt-1 text-blue-400" />
            <div>
              <h3 className="font-semibold mb-1">Website & Alerts</h3>
              <p className="text-gray-300 text-sm">Check back soon for updates and alerts</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400">
          <p>© KKR CABLE NETWORKS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
