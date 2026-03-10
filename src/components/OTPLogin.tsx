/**
 * OTP Login Component
 * ====================
 * Farmer-friendly phone authentication with OTP via SMS.
 * Uses Firebase Phone Authentication (free tier).
 * 
 * Flow:
 * 1. Enter mobile number
 * 2. Receive OTP via SMS
 * 3. Enter OTP
 * 4. Verify and proceed
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    initializeRecaptcha,
    sendOTP,
    verifyOTP,
    resendOTP,
    isValidPhoneNumber,
    clearRecaptcha
} from '../services/phoneAuth';

type OTPStep = 'phone' | 'otp' | 'success';

interface OTPLoginProps {
    onSuccess: (user: any, isNewUser: boolean) => void;
    onCancel?: () => void;
    title?: string;
    subtitle?: string;
}

const OTPLogin: React.FC<OTPLoginProps> = ({
    onSuccess,
    onCancel,
    title = "Login with Mobile",
    subtitle = "Enter your mobile number to continue"
}) => {
    // State
    const [step, setStep] = useState<OTPStep>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(false);

    // Refs
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const recaptchaContainerRef = useRef<HTMLDivElement>(null);

    // Initialize reCAPTCHA on mount
    useEffect(() => {
        // Delay initialization to ensure container is mounted
        const timer = setTimeout(() => {
            try {
                initializeRecaptcha('recaptcha-container', true);
            } catch (e) {
                console.log('reCAPTCHA init delayed');
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            clearRecaptcha();
        };
    }, []);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && step === 'otp') {
            setCanResend(true);
        }
    }, [countdown, step]);

    // Handle phone number input
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow digits
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhoneNumber(value);
        setError('');
    };

    // Handle OTP input
    const handleOtpChange = (index: number, value: string) => {
        // Only allow single digit
        if (value.length > 1) {
            value = value.slice(-1);
        }

        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (index === 5 && value) {
            const fullOtp = newOtp.join('');
            if (fullOtp.length === 6) {
                handleVerifyOTP(fullOtp);
            }
        }
    };

    // Handle OTP key down (backspace navigation)
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    // Handle OTP paste
    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            handleVerifyOTP(pastedData);
        }
    };

    // Send OTP
    const handleSendOTP = async () => {
        // Validate phone
        if (!phoneNumber || phoneNumber.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        if (!isValidPhoneNumber(phoneNumber)) {
            setError('Invalid mobile number. Must start with 6, 7, 8, or 9');
            return;
        }

        setLoading(true);
        setError('');

        const result = await sendOTP(phoneNumber);

        setLoading(false);

        if (result.success) {
            setSuccessMessage(`OTP sent to +91 ${phoneNumber}`);
            setStep('otp');
            setCountdown(30); // 30 seconds before resend
            setCanResend(false);

            // Focus first OTP input
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 100);
        } else {
            setError(result.error || 'Failed to send OTP');
        }
    };

    // Verify OTP
    const handleVerifyOTP = async (otpValue?: string) => {
        const otpToVerify = otpValue || otp.join('');

        if (otpToVerify.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        const result = await verifyOTP(otpToVerify);

        setLoading(false);

        if (result.success && result.user) {
            setSuccessMessage('OTP verified successfully!');
            setStep('success');

            // Notify parent after brief delay
            setTimeout(() => {
                onSuccess(result.user, result.isNewUser || false);
            }, 1000);
        } else {
            setError(result.error || 'Invalid OTP');
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (!canResend) return;

        setLoading(true);
        setError('');
        setOtp(['', '', '', '', '', '']);

        const result = await resendOTP(phoneNumber);

        setLoading(false);

        if (result.success) {
            setSuccessMessage('New OTP sent!');
            setCountdown(30);
            setCanResend(false);
            otpInputRefs.current[0]?.focus();
        } else {
            setError(result.error || 'Failed to resend OTP');
        }
    };

    // Go back to phone step
    const handleBack = () => {
        setStep('phone');
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccessMessage('');
        clearRecaptcha();

        // Reinitialize reCAPTCHA
        setTimeout(() => {
            initializeRecaptcha('recaptcha-container', true);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="bg-green-600 px-6 py-8 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">{title}</h1>
                        <p className="text-green-100 mt-2 text-sm">{subtitle}</p>
                    </div>

                    {/* Content */}
                    <div className="p-6">

                        {/* Step 1: Phone Number */}
                        {step === 'phone' && (
                            <div className="space-y-6">
                                {/* Phone Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mobile Number
                                    </label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-4 border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-lg font-semibold rounded-l-xl">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            placeholder="Enter 10-digit number"
                                            className="flex-1 px-4 py-4 text-lg border border-gray-300 rounded-r-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            maxLength={10}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        We'll send a 6-digit OTP to this number
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                {/* Send OTP Button */}
                                <button
                                    onClick={handleSendOTP}
                                    disabled={loading || phoneNumber.length !== 10}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending OTP...
                                        </>
                                    ) : (
                                        <>
                                            Send OTP
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {/* Cancel */}
                                {onCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="w-full text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === 'otp' && (
                            <div className="space-y-6">
                                {/* Success Message */}
                                {successMessage && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {successMessage}
                                    </div>
                                )}

                                {/* OTP Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                                        Enter 6-digit OTP
                                    </label>
                                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => { otpInputRefs.current[index] = el; }}
                                                type="text"
                                                inputMode="numeric"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                                maxLength={1}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                {/* Verify Button */}
                                <button
                                    onClick={() => handleVerifyOTP()}
                                    disabled={loading || otp.join('').length !== 6}
                                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify OTP
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {/* Resend & Back */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={handleBack}
                                        className="text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Change Number
                                    </button>

                                    {canResend ? (
                                        <button
                                            onClick={handleResendOTP}
                                            disabled={loading}
                                            className="text-green-600 font-semibold text-sm hover:text-green-700 transition-colors"
                                        >
                                            Resend OTP
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-sm">
                                            Resend in {countdown}s
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Success */}
                        {step === 'success' && (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">
                                    OTP Verified Successfully!
                                </h2>
                                <p className="text-gray-500">
                                    Redirecting to your dashboard...
                                </p>
                                <div className="mt-4">
                                    <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 text-center">
                        <p className="text-xs text-gray-400">
                            Secured by Firebase Phone Authentication
                        </p>
                    </div>

                </div>

                {/* reCAPTCHA Container (invisible) */}
                <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

            </div>
        </div>
    );
};

export default OTPLogin;
