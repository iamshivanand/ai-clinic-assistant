import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Globe, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Layout, 
  User, 
  Award,
  ExternalLink,
  Loader2,
  Camera
} from 'lucide-react';
import { getPortfolio, updatePortfolio, uploadPortfolioImage } from '../services/api';
import { toast } from 'react-hot-toast';

const PortfolioBuilder = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState('');
  const [portfolio, setPortfolio] = useState({
    templateId: 'modern',
    profileImage: '',
    bio: '',
    specialties: [],
    achievements: [],
    themeColor: '#2563eb',
    isPublished: false,
    socialLinks: { facebook: '', twitter: '', instagram: '', linkedin: '' }
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await getPortfolio();
      if (res.data.data) setPortfolio(res.data.data);
      if (res.data.slug) setSlug(res.data.slug);
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePortfolio({ portfolio, slug });
      toast.success('Portfolio updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, type, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await uploadPortfolioImage(formData);
      const url = res.data.url;

      if (type === 'profile') {
        setPortfolio({ ...portfolio, profileImage: url });
      } else if (type === 'achievement') {
        const newAchievements = [...portfolio.achievements];
        newAchievements[index].image = url;
        setPortfolio({ ...portfolio, achievements: newAchievements });
      }
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const addAchievement = () => {
    setPortfolio({
      ...portfolio,
      achievements: [...portfolio.achievements, { year: '', title: '', description: '', image: '' }]
    });
  };

  const removeAchievement = (index) => {
    const newAchievements = portfolio.achievements.filter((_, i) => i !== index);
    setPortfolio({ ...portfolio, achievements: newAchievements });
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website Builder</h1>
          <p className="text-gray-500">Design your public online presence.</p>
        </div>
        <div className="flex space-x-3">
          {portfolio.isPublished && (
            <a 
              href={`/p/${slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-all"
            >
              <ExternalLink size={18} />
              <span>View Site</span>
            </a>
          )}
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Identity & Slug */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Globe className="mr-3 text-blue-600" /> Public Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 ml-1">Website URL Slug</label>
                <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100 px-4">
                  <span className="text-gray-400 font-medium mr-1">/p/</span>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="flex-1 py-4 bg-transparent outline-none font-bold text-gray-900"
                    placeholder="dr-john-doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 ml-1">Publication Status</label>
                <div className="flex items-center space-x-4 h-[60px]">
                  <button 
                    onClick={() => setPortfolio({...portfolio, isPublished: !portfolio.isPublished})}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${portfolio.isPublished ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-gray-100 text-gray-500 border-2 border-gray-200'}`}
                  >
                    {portfolio.isPublished ? 'Live & Published' : 'Draft / Hidden'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Profile Bio */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <User className="mr-3 text-blue-600" /> About & Bio
            </h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {portfolio.profileImage ? (
                      <img src={`http://localhost:5000${portfolio.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-gray-300" size={32} />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl text-white shadow-lg cursor-pointer hover:scale-110 transition-all">
                    <Plus size={16} />
                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'profile')} />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Profile Photo</p>
                  <p className="text-sm text-gray-500">This will be featured on your landing page.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 ml-1">Doctor Bio</label>
                <textarea 
                  rows="4"
                  value={portfolio.bio}
                  onChange={(e) => setPortfolio({...portfolio, bio: e.target.value})}
                  className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 font-medium"
                  placeholder="Share your experience and medical philosophy..."
                />
              </div>
            </div>
          </section>

          {/* Achievements Section */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Award className="mr-3 text-blue-600" /> Achievements & Awards
              </h2>
              <button 
                onClick={addAchievement}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {portfolio.achievements.map((ach, idx) => (
                <div key={idx} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 relative group">
                  <button 
                    onClick={() => removeAchievement(idx)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Year</label>
                      <input 
                        type="text" 
                        value={ach.year}
                        onChange={(e) => {
                          const newAchs = [...portfolio.achievements];
                          newAchs[idx].year = e.target.value;
                          setPortfolio({...portfolio, achievements: newAchs});
                        }}
                        className="w-full p-3 bg-white rounded-xl border border-gray-100 outline-none"
                        placeholder="2024"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Award Title</label>
                      <input 
                        type="text" 
                        value={ach.title}
                        onChange={(e) => {
                          const newAchs = [...portfolio.achievements];
                          newAchs[idx].title = e.target.value;
                          setPortfolio({...portfolio, achievements: newAchs});
                        }}
                        className="w-full p-3 bg-white rounded-xl border border-gray-100 outline-none"
                        placeholder="Best Surgeon of the Year"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Photo</label>
                      <div className="relative">
                        <div className="h-[48px] bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                          {ach.image ? (
                            <img src={`http://localhost:5000${ach.image}`} className="w-full h-full object-cover" />
                          ) : <ImageIcon size={20} className="text-gray-300" />}
                        </div>
                        <label className="absolute inset-0 cursor-pointer">
                          <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'achievement', idx)} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {portfolio.achievements.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl">
                  <Award className="mx-auto text-gray-200 mb-2" size={40} />
                  <p className="text-gray-400 font-bold">No achievements added yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Appearance */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Layout className="mr-3 text-blue-600" /> Appearance
            </h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-500">Template Choice</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPortfolio({...portfolio, templateId: 'modern'})}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${portfolio.templateId === 'modern' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <Layout className={portfolio.templateId === 'modern' ? 'text-blue-600' : 'text-gray-400'} />
                    <p className={`mt-2 font-bold text-sm ${portfolio.templateId === 'modern' ? 'text-blue-900' : 'text-gray-500'}`}>Modern Medical</p>
                  </button>
                  <button 
                    onClick={() => setPortfolio({...portfolio, templateId: 'personal'})}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${portfolio.templateId === 'personal' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <User className={portfolio.templateId === 'personal' ? 'text-blue-600' : 'text-gray-400'} />
                    <p className={`mt-2 font-bold text-sm ${portfolio.templateId === 'personal' ? 'text-blue-900' : 'text-gray-500'}`}>Personal Brand</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-500">Theme Color</label>
                <div className="flex flex-wrap gap-3">
                  {['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setPortfolio({...portfolio, themeColor: color})}
                      className={`w-10 h-10 rounded-full border-4 ${portfolio.themeColor === color ? 'border-white ring-2 ring-blue-600' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={portfolio.themeColor}
                    onChange={(e) => setPortfolio({...portfolio, themeColor: e.target.value})}
                    className="w-10 h-10 rounded-full overflow-hidden border-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-gray-900 to-blue-900 p-8 rounded-[2.5rem] shadow-xl text-white">
            <h3 className="text-lg font-bold mb-4">Pro Tip 💡</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              A complete portfolio with achievements and a personal photo increases booking rates by up to 40%.
            </p>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
              <p className="text-xs font-bold text-blue-200 uppercase mb-1">SEO Status</p>
              <div className="flex items-center text-sm">
                <CheckCircle className="text-green-400 mr-2" size={16} />
                <span>Google-Ready Meta Tags</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
