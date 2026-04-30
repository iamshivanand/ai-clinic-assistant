import React, { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const WhatsAppSetup = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('IDLE'); // IDLE, CONNECTING, SUCCESS, ERROR

  useEffect(() => {
    // 1. Load the Facebook SDK
    const loadSDK = () => {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_FB_APP_ID || 'YOUR_APP_ID',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadSDK();
  }, []);

  const launchWhatsAppSignup = () => {
    setLoading(true);
    setStatus('CONNECTING');

    window.FB.login(async (response) => {
      if (response.authResponse) {
        const code = response.authResponse.code;
        console.log('Capture Code:', code);
        
        try {
          // Send code to backend to exchange for token
          await api.post('/onboarding/exchange-code', { code });
          setStatus('SUCCESS');
        } catch (error) {
          console.error('Onboarding failed:', error);
          setStatus('ERROR');
        }
      } else {
        console.log('User cancelled login or did not fully authorize.');
        setStatus('IDLE');
      }
      setLoading(false);
    }, {
      config_id: import.meta.env.VITE_META_CONFIG_ID || 'YOUR_CONFIG_ID',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {
          // Any extra setup data
        }
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center text-white">
          <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">WhatsApp Business</h1>
          <p className="text-blue-100 mt-2 text-lg">Power your clinic with automated AI assistance</p>
        </div>

        <div className="p-12 space-y-10">
          {status === 'IDLE' && (
            <>
              <div className="space-y-6">
                <div className="flex items-start space-x-5 group">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl font-bold group-hover:scale-110 transition-transform">1</div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Facebook Auth</p>
                    <p className="text-gray-500">Log in to the account managing your clinic's business page.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-5 group">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl font-bold group-hover:scale-110 transition-transform">2</div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Select Number</p>
                    <p className="text-gray-500">Choose the official WhatsApp number for patient inquiries.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-5 group">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl font-bold group-hover:scale-110 transition-transform">3</div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Auto-Pilot Live</p>
                    <p className="text-gray-500">The AI starts handling bookings using your strict templates.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={launchWhatsAppSignup}
                disabled={loading}
                className="w-full py-5 px-8 bg-blue-600 text-white rounded-2xl font-bold text-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 shadow-xl shadow-blue-200"
              >
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : null}
                <span>Activate WhatsApp Bot</span>
                <ArrowRight className="h-6 w-6" />
              </button>
            </>
          )}

          {status === 'SUCCESS' && (
            <div className="text-center py-10 space-y-6">
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">Successfully Linked!</h2>
              <p className="text-gray-500 text-lg max-w-sm mx-auto">
                Your WhatsApp Business account is active. The autonomous assistant is now managing your bookings.
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center space-x-2 text-blue-600 font-bold text-lg hover:underline"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="text-center py-10 space-y-4">
              <p className="text-red-600 font-bold font-lg">Something went wrong.</p>
              <button 
                onClick={() => setStatus('IDLE')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSetup;
