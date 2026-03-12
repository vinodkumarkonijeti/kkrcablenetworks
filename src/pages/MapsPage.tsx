import { useState, useEffect } from 'react';
import { Map as MapIcon, Users, MapPin, Navigation, Signal } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MapsPage = () => {
    const [villageStats, setVillageStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMapData();
    }, []);

    const fetchMapData = async () => {
        setLoading(true);
        try {
            const { data: customers } = await supabase
                .from('customers')
                .select('village, mandal, status');

            const statsMap: Record<string, { count: number; active: number; mandal: string }> = {};

            customers?.forEach(c => {
                if (!statsMap[c.village]) {
                    statsMap[c.village] = { count: 0, active: 0, mandal: c.mandal };
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

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Network Coverage</h1>
                    <p className="text-gray-500 dark:text-gray-400">Subscriber distribution by region</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
                    <MapIcon size={24} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-bold px-2 dark:text-white">Village Wise Distribution</h3>
                    <div className="space-y-3">
                        {villageStats.map((item, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold dark:text-white">{item.village}</h4>
                                            <p className="text-xs text-gray-400 uppercase tracking-tighter">{item.mandal} MANDAL</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-blue-600">{item.count}</span>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Users</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-blue-600 h-full rounded-full" 
                                        style={{ width: `${(item.active / item.count) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <span>{item.active} Active</span>
                                    <span>{Math.round((item.active / item.count) * 100)}% Coverage</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area - Visual Density Map */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                                <Signal size={24} className="text-blue-500" /> Density Visualization
                            </h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">High Density</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Normal</span>
                            </div>
                        </div>

                        <div className="relative h-[500px] border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] flex items-center justify-center overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
                            {/* Abstract Map Nodes */}
                            {villageStats.map((item, i) => {
                                const size = 60 + (item.count * 5);
                                return (
                                    <div 
                                        key={i}
                                        className="absolute animate-pulse"
                                        style={{
                                            left: `${20 + (i * 15) % 60}%`,
                                            top: `${15 + (i * 20) % 70}%`,
                                            width: `${size}px`,
                                            height: `${size}px`,
                                        }}
                                    >
                                        <div className={`w-full h-full rounded-full ${item.count > 10 ? 'bg-blue-600/10' : 'bg-purple-600/10'} flex items-center justify-center border-2 ${item.count > 10 ? 'border-blue-600/20' : 'border-purple-600/20'} backdrop-blur-sm relative group`}>
                                            <div className={`w-3 h-3 rounded-full ${item.count > 10 ? 'bg-blue-600' : 'bg-purple-600'} shadow-lg`} />
                                            <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 p-2 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 z-10 whitespace-nowrap">
                                                <p className="text-xs font-bold dark:text-white">{item.village}</p>
                                                <p className="text-[10px] text-gray-400">{item.count} Subscribers</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center space-y-2">
                                    <Navigation size={48} className="text-gray-200 dark:text-gray-800 mx-auto" />
                                    <p className="text-sm font-bold text-gray-400 capitalize">Subscribers Density Map</p>
                                    <p className="text-[10px] text-gray-300 dark:text-gray-600">PIN CODE: 523271 • ZARUGUMALLI MANDAL</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50 flex gap-4 items-start">
                            <div className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                                <MapIcon size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-300">Google Maps Integration Ready</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                    Your subscriber coordinates are ready. Add your GOOGLE_MAPS_API_KEY in the Settings to see precise street-level locations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapsPage;
