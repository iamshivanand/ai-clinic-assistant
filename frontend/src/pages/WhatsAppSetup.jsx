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
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Connect WhatsApp Business</h1>
          <p className="text-blue-100 mt-2">Power your clinic with automated appointments</p>
        </div>

        <div className="p-10 space-y-8">
          {status === 'IDLE' && (
            <>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-100 p-2 rounded-lg font-bold text-gray-600">1</div>
                  <div>
                    <p className="font-semibold text-gray-900">Sign in with Facebook</p>
                    <p className="text-sm text-gray-500">Log in to the account that manages your business page.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-100 p-2 rounded-lg font-bold text-gray-600">2</div>
                  <div>
                    <p className="font-semibold text-gray-900">Select WhatsApp Account</p>
                    <p className="text-sm text-gray-500">Choose the number you want to use for your clinic.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-gray-100 p-2 rounded-lg font-bold text-gray-600">3</div>
                  <div>
                    <p className="font-semibold text-gray-900">Activate Bot</p>
                    <p className="text-sm text-gray-500">The AI assistant will start handling your bookings instantly.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={launchWhatsAppSignup}
                disabled={loading}
                className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-200"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : null}
                <span>Connect WhatsApp Now</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}

          {status === 'SUCCESS' && (
            <div className="text-center py-10 space-y-4">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">You're Connected!</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                Your WhatsApp Business account is successfully linked. The bot is now live for your clinic.
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="mt-6 text-blue-600 font-semibold hover:underline"
              >
                Go to Dashboard
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
