import { Map as MapIcon, Info } from 'lucide-react';

const MapsPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Network Maps</h1>
                    <p className="text-gray-500 dark:text-gray-400">Visualize your cable network coverage</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400">
                    <MapIcon size={24} />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-12 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                    <Info size={40} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Maps Integration Coming Soon</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        We are working on integrating Google Maps to show your subscriber distributions and line coverage in real-time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MapsPage;
