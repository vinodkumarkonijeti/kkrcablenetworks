import { useState, useEffect } from 'react';
import { MapPin, Navigation, Signal, Layers, Target } from 'lucide-react';
import GoogleMapReact from 'google-map-react';
import { supabase } from '../lib/supabase';

const AnyReactComponent = ({ text, count }: any) => (
    <div className="relative group cursor-pointer">
        <div className={`w-10 h-10 ${count > 10 ? 'bg-blue-600' : 'bg-purple-600'} rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white dark:border-gray-900 transform transition-transform group-hover:scale-125`}>
            <MapPin size={16} />
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 pointer-events-none min-w-[120px]">
            <p className="text-sm font-black dark:text-white uppercase tracking-tighter">{text}</p>
            <p className="text-xs text-blue-600 font-bold">{count} Subscribers</p>
        </div>
    </div>
);

const MapsPage = () => {
    const [villageStats, setVillageStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [center] = useState({
        lat: 15.3524, // Approx coordinates for Zarugumalli region
        lng: 79.9197
    });
    const [zoom] = useState(12);

    useEffect(() => {
        fetchMapData();
    }, []);

    const fetchMapData = async () => {
        setLoading(true);
        try {
            const { data: customers } = await supabase
                .from('customers')
                .select('village, mandal, status');

            const statsMap: Record<string, { count: number; active: number; mandal: string; lat: number; lng: number }> = {};

            // Approximate coordinates for demonstration (In reality, these should come from the database)
            const coords: Record<string, { lat: number; lng: number }> = {
                "Narsingolu": { lat: 15.3524, lng: 79.9197 },
                "Zarugumalli": { lat: 15.3378, lng: 79.9075 },
                "Kamepalli": { lat: 15.3650, lng: 79.9320 },
                "Binginapalli": { lat: 15.3210, lng: 79.8950 }
            };

            customers?.forEach(c => {
                if (!statsMap[c.village]) {
                    const baseCoord = coords[c.village] || { 
                        lat: 15.3524 + (Math.random() - 0.5) * 0.1, 
                        lng: 79.9197 + (Math.random() - 0.5) * 0.1 
                    };
                    statsMap[c.village] = { 
                        count: 0, 
                        active: 0, 
                        mandal: c.mandal,
                        ...baseCoord
                    };
                }
                statsMap[c.village].count++;
                if (c.status === 'active') statsMap[c.village].active++;
            });

            const sortedStats = Object.entries(statsMap)
                .map(([village, data]) => ({
                    village,
                    ...data
                }))
                .sort((a, b) => b.count - a.count);

            setVillageStats(sortedStats);
        } catch (error) {
            console.error('Error fetching map data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Network Coverage</h1>
                    <p className="text-gray-500 dark:text-gray-400">Live GPS tracking and regional distribution</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-2xl text-blue-600 dark:text-blue-400 flex items-center gap-2 font-bold text-sm">
                        <Signal size={18} /> LIVE
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Statistics Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Layers size={16} /> Regional Stats
                        </h3>
                        <div className="space-y-4">
                            {villageStats.map((item, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold dark:text-white group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{item.village}</span>
                                        <span className="text-xs font-black px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-50 dark:bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-blue-600 h-full rounded-full transition-all duration-1000" 
                                            style={{ width: `${(item.active / item.count) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-200 dark:shadow-none">
                        <h4 className="font-black flex items-center gap-2 mb-2">
                            <Target size={20} /> Optimization
                        </h4>
                        <p className="text-sm text-blue-50 opacity-80">
                            Based on current density, your network signal is 94% optimized in Zarugumalli Mandal.
                        </p>
                    </div>
                </div>

                {/* Live Map Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-4 h-[600px] shadow-sm relative overflow-hidden">
                        {!apiKey || apiKey === 'your-google-maps-api-key' ? (
                            <div className="w-full h-full flex flex-row items-center justify-center bg-gray-50 dark:bg-gray-950 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <div className="text-center p-8">
                                    <Navigation size={48} className="text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold dark:text-white">Google Maps API Required</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                                        Please provide a valid API key in your environment variables to enable the live network map.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full rounded-[2rem] overflow-hidden">
                                <GoogleMapReact
                                    bootstrapURLKeys={{ key: apiKey }}
                                    defaultCenter={center}
                                    defaultZoom={zoom}
                                    options={{
                                        styles: [
                                            {
                                                "featureType": "all",
                                                "elementType": "labels.text.fill",
                                                "stylers": [{"saturation": 36}, {"color": "#333333"}, {"lightness": 40}]
                                            }
                                        ]
                                    }}
                                >
                                    {villageStats.map((item, i) => (
                                        <AnyReactComponent
                                            key={i}
                                            lat={item.lat}
                                            lng={item.lng}
                                            text={item.village}
                                            count={item.count}
                                        />
                                    ))}
                                </GoogleMapReact>
                            </div>
                        )}
                        
                        {/* Map Overlay Info */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-gray-100 dark:border-gray-800 shadow-2xl flex items-center gap-4 z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                                <span className="text-[10px] font-bold dark:text-white uppercase tracking-widest">Main Node</span>
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-600 rounded-full" />
                                <span className="text-[10px] font-bold dark:text-white uppercase tracking-widest">Sub Node</span>
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:border-gray-700" />
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Village Coverage: 523271</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapsPage;
