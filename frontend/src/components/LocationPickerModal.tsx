import React, { useState } from 'react';
import { X, Navigation, MapPin, ShieldCheck, Check } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

export const LocationPickerModal: React.FC = () => {
  const { location, updateLocation, detectGPSLocation, isModalOpen, closeModal } = useLocation() as any;
  const [city, setCity] = useState(location.city);
  const [state, setState] = useState(location.state);
  const [country, setCountry] = useState(location.country);
  const [radiusKm, setRadiusKm] = useState(location.radiusKm);
  const [isDetecting, setIsDetecting] = useState(false);

  if (!isModalOpen) return null;

  const handleGPSDetect = async () => {
    setIsDetecting(true);
    try {
      await detectGPSLocation();
      closeModal();
    } catch (e) {
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;
    updateLocation({
      city,
      state: state || 'State',
      country: country || 'India',
      radiusKm,
      isGPS: false
    });
    closeModal();
  };

  const radiusOptions = [5, 10, 25, 50, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="font-serif font-bold text-lg">Where are you located?</h3>
              <p className="text-amber-100 text-xs">Discover book swappers in your neighborhood</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* GPS Button */}
          <div>
            <button
              onClick={handleGPSDetect}
              disabled={isDetecting}
              className="w-full py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Navigation className={`w-4 h-4 text-amber-600 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting coordinates...' : 'Use Current Device Location (GPS)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Or Enter Manually</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Manual Location Form */}
          <form onSubmit={handleSaveManual} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Neighborhood</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Indiranagar, Bengaluru"
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Karnataka"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Radius Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Maximum Search Radius</label>
              <div className="grid grid-cols-5 gap-2">
                {radiusOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      radiusKm === r
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Note */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                <strong>Privacy Guaranteed:</strong> We never expose your exact home address or coordinates to other users. Only your approximate neighborhood area is shown.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-md shadow-amber-600/20"
            >
              Save Location & Radius
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
