import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPortfolio } from '../services/api';
import ModernTemplate from '../components/templates/ModernTemplate';
import PersonalTemplate from '../components/templates/PersonalTemplate';
import { Loader2, AlertCircle } from 'lucide-react';

const PublicPortfolio = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPublicPortfolio(slug);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Portfolio not found or unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl text-center">
          <AlertCircle className="mx-auto text-red-500 mb-6" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <a href="/" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100">Go Home</a>
        </div>
      </div>
    );
  }

  // Render template based on choice
  switch (data.portfolio.templateId) {
    case 'personal':
      return <PersonalTemplate data={data} />;
    case 'modern':
    default:
      return <ModernTemplate data={data} />;
  }
};

export default PublicPortfolio;
