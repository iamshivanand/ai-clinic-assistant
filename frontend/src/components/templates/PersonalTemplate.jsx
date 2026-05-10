import React from 'react';
import { MessageSquare, Star, Award, MapPin, Instagram, Linkedin, Twitter } from 'lucide-react';

const PersonalTemplate = ({ data }) => {
  const { name, ownerName, portfolio, whatsappNumber } = data;
  const { themeColor, profileImage, bio, achievements, socialLinks } = portfolio;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-white selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ backgroundColor: themeColor }}></div>
        <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-10" style={{ backgroundColor: themeColor }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <section className="flex flex-col md:flex-row items-center gap-12 mb-32">
          <div className="relative">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-[3rem] overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
              {profileImage ? (
                <img src={`http://localhost:5000${profileImage}`} alt={ownerName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">No Image</div>
              )}
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white text-black flex flex-col items-center justify-center font-bold rotate-12 shadow-xl">
              <Star fill="black" size={20} />
              <span className="text-xs uppercase">Specialist</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-6xl font-black mb-4 leading-tight italic tracking-tighter">I'm {ownerName}</h1>
            <p className="text-2xl font-bold mb-8 text-gray-400">Pioneering Health at <span style={{ color: themeColor }}>{name}</span></p>
            <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-xl">{bio}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a 
                href={`https://wa.me/${whatsappNumber}`}
                className="px-10 py-5 rounded-full font-black text-xl flex items-center justify-center space-x-3 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/20"
                style={{ backgroundColor: themeColor }}
              >
                <MessageSquare size={24} />
                <span>Let's Talk</span>
              </a>
              <div className="flex items-center justify-center space-x-4 px-6">
                {socialLinks?.instagram && <a href={socialLinks.instagram} className="text-gray-400 hover:text-white transition-all"><Instagram size={24} /></a>}
                {socialLinks?.linkedin && <a href={socialLinks.linkedin} className="text-gray-400 hover:text-white transition-all"><Linkedin size={24} /></a>}
                {socialLinks?.twitter && <a href={socialLinks.twitter} className="text-gray-400 hover:text-white transition-all"><Twitter size={24} /></a>}
              </div>
            </div>
          </div>
        </section>

        {/* Achievements Timeline */}
        <section className="mb-32">
          <h2 className="text-4xl font-black mb-16 flex items-center">
            <Award className="mr-4" size={40} style={{ color: themeColor }} /> 
            Hall of Fame
          </h2>
          <div className="space-y-12">
            {achievements.map((ach, idx) => (
              <div key={idx} className="group relative pl-12 border-l-2 border-slate-800 py-4">
                <div className="absolute top-8 -left-3 w-6 h-6 rounded-full border-4 border-slate-900 transition-all group-hover:scale-150" style={{ backgroundColor: themeColor }}></div>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <span className="text-lg font-bold opacity-40">{ach.year}</span>
                    <h3 className="text-2xl font-black mb-3 group-hover:translate-x-2 transition-transform">{ach.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{ach.description}</p>
                  </div>
                  {ach.image && (
                    <div className="w-full md:w-64 h-40 rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                      <img src={`http://localhost:5000${ach.image}`} alt={ach.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-20 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 font-bold uppercase tracking-widest text-xs">
          <div className="flex items-center space-x-4">
            <MapPin size={16} />
            <span>Ready to transform your life?</span>
          </div>
          <p>© {new Date().getFullYear()} {ownerName} - Powered by AI Assistant</p>
        </footer>
      </div>
    </div>
  );
};

export default PersonalTemplate;
