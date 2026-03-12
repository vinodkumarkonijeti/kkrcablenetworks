import { BarChart3, Info } from 'lucide-react';

const ReportsPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Business Reports</h1>
                    <p className="text-gray-500 dark:text-gray-400">Detailed analytics and financial summaries</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-2xl text-purple-600 dark:text-purple-400">
                    <BarChart3 size={24} />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-12 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                    <Info size={40} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Analytics Engine Under Development</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Advanced reports including monthly revenue projections and operator performance metrics will be available here soon.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
