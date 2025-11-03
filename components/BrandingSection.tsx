import React from 'react';
import type { BrandingState } from '../types';

interface BrandingSectionProps {
    branding: BrandingState;
    onBrandingChange: (field: keyof BrandingState, value: string) => void;
    onSave: () => void;
    onReset: () => void;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({ branding, onBrandingChange, onSave, onReset }) => {

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onBrandingChange('logo', reader.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert("Please upload a valid image file (JPG or PNG).");
        }
    };

    const handleRemoveLogo = () => {
        onBrandingChange('logo', '');
        // Reset file input value so the same file can be re-uploaded
        const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* Logo Uploader */}
                <div className="flex flex-col gap-3 items-center">
                    <label htmlFor="logo-upload" className="text-sm font-medium text-slate-700 dark:text-slate-300 self-center cursor-pointer">
                        Upload Logo (JPG/PNG)
                    </label>
                    <input
                        id="logo-upload"
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-200 dark:hover:file:bg-slate-600"
                    />
                    {branding.logo && (
                        <div className="mt-2 text-center p-2 border rounded-md bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600">
                            <img src={branding.logo} alt="Logo Preview" className="h-20 w-auto object-contain mx-auto" />
                            <button onClick={handleRemoveLogo} className="mt-2 text-xs text-red-600 hover:underline">
                                Remove Logo
                            </button>
                        </div>
                    )}
                </div>

                {/* Color Pickers */}
                <div className="flex flex-col gap-4 items-center">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 self-center">PDF Theme Colors</div>
                    <div className="flex items-center justify-center gap-8">
                        <div className="flex flex-col items-center">
                            <label htmlFor="primaryColor" className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">Primary</label>
                            <input
                                type="color"
                                id="primaryColor"
                                value={branding.primaryColor}
                                onChange={(e) => onBrandingChange('primaryColor', e.target.value)}
                                className="w-12 h-12 p-1 border-2 border-slate-200 dark:border-slate-600 rounded-md cursor-pointer"
                                title="Primary Color for Main Headers"
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <label htmlFor="secondaryColor" className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">Secondary</label>
                            <input
                                type="color"
                                id="secondaryColor"
                                value={branding.secondaryColor}
                                onChange={(e) => onBrandingChange('secondaryColor', e.target.value)}
                                className="w-12 h-12 p-1 border-2 border-slate-200 dark:border-slate-600 rounded-md cursor-pointer"
                                title="Secondary Color for Lift Headers"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-center sm:justify-end gap-3">
                <button
                    onClick={onReset}
                    className="px-6 py-2 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-md shadow-sm transition-colors"
                >
                    Reset Defaults
                </button>
                <button
                    onClick={onSave}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-md shadow-sm transition-colors"
                >
                    Save Settings
                </button>
            </div>
        </>
    );
};

export default BrandingSection;