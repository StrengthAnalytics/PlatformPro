import React, { useState } from 'react';
import IconButton from './IconButton';

interface EmailGateProps {
  onVerify: () => void;
}

// IMPORTANT: Replace these values with the ones from your Kajabi form embed code.
const KAJABI_FORM_ACTION = 'https://checkout.kajabi.com/forms/2148216110/submissions'; // Replace with your action URL
const KAJABI_NAME_FIELD_NAME = 'form[name]'; // Replace with the 'name' of your name input
const KAJABI_EMAIL_FIELD_NAME = 'form[email]'; // Replace with the 'name' of your email input
const KAJABI_FORM_ID = '2148216110'; // Replace with your form_id value

const EmailGate: React.FC<EmailGateProps> = ({ onVerify }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    const formData = new URLSearchParams();
    formData.append(KAJABI_NAME_FIELD_NAME, name);
    formData.append(KAJABI_EMAIL_FIELD_NAME, email);
    formData.append('form_id', KAJABI_FORM_ID);

    try {
      // We use 'no-cors' mode because Kajabi's endpoint is on a different domain.
      // This will send the data successfully, but we won't be able to read the response.
      // For a "fire-and-forget" email submission, this is perfectly fine.
      await fetch(KAJABI_FORM_ACTION, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      setIsSubmitted(true);
      // Wait a moment after showing the success message before unlocking the app.
      setTimeout(() => {
        onVerify();
      }, 1500);

    } catch (e) {
      console.error('Kajabi form submission failed', e);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-4 font-sans animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-700 p-8 rounded-xl shadow-2xl text-center">
        {isSubmitted ? (
            <div className="animate-popIn">
                <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">Thank You!</h2>
                <p className="text-slate-600 dark:text-slate-300 mt-2">Please check your inbox to confirm your subscription. The app is unlocking now...</p>
            </div>
        ) : (
            <>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Get Free Access To The Competition Planner</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-3 mb-6">
                You'll get full access to all functions and features.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-6 -mt-4">
                  You will need to confirm this address by clicking on the link that we send you.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      required
                      className="w-full text-center p-3 text-lg border-2 rounded-md shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-500/50 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your Email"
                      required
                      className="w-full text-center p-3 text-lg border-2 rounded-md shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-500/50 bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-600 dark:placeholder-slate-400"
                    />
                    <IconButton type="submit" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Unlock Now'}
                    </IconButton>
                </div>
                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                </form>
            </>
        )}
      </div>
    </div>
  );
};

export default EmailGate;