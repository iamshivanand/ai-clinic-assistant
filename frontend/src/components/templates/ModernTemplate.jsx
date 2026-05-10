import React from 'react';
import { MessageSquare, MapPin, Phone, Award, CheckCircle } from 'lucide-react';

const ModernTemplate = ({ data }) => {
  const { name, ownerName, portfolio, address, whatsappNumber } = data;
  const { themeColor, profileImage, bio, achievements } = portfolio;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero Section */}
      <header className="bg-slate-50 py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            {profileImage ? (
              <img src={`http://localhost:5000${profileImage}`} alt={ownerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">No Image</div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight" style={{ color: themeColor }}>{ownerName}</h1>
            <p className="text-2xl text-slate-600 font-medium mb-6">{name}</p>
            <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mb-8">{bio}</p>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl hover:scale-105 transition-all"
              style={{ backgroundColor: themeColor }}
            >
              <MessageSquare size={24} />
              <span>Book Appointment via AI</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-20 px-6 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Achievements */}
        <div className="lg:col-span-2 space-y-12">
          <h2 className="text-3xl font-bold border-l-8 pl-6" style={{ borderLeftColor: themeColor }}>Professional Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {achievements.map((ach, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all group">
                {ach.image && (
                  <div className="h-48 mb-6 rounded-2xl overflow-hidden">
                    <img src={`http://localhost:5000${ach.image}`} alt={ach.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                  </div>
                )}
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: themeColor }}>{ach.year}</span>
                <h3 className="text-xl font-bold mt-2 mb-3">{ach.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{ach.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Contact Info</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="mt-1 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Address</p>
                  <p className="font-medium text-slate-200">{address || 'Contact clinic for address'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Phone className="mt-1 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</p>
                  <p className="font-medium text-slate-200">+{whatsappNumber}</p>
                </div>
              </div>
            </div>
            <hr className="my-8 border-slate-800" />
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-400" />
              <p className="text-sm text-slate-400 font-medium">AI Assistant Active 24/7</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} {name}. Powered by AI Clinic Assistant.</p>
      </footer>
    </div>
  );
};

export default ModernTemplate;
